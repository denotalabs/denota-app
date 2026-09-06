import { Box, Flex, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { Wallet } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import { useTokens } from "../../../hooks/useTokens";
import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";
import AccountField from "../../fields/input/AccountField";
import AmountField from "../../fields/input/AmountField";
import { DetailsStepFormValues } from "./DetailsStepForm";
import { allowsZeroPaymentAmount } from "./paymentMetadata";
import { TokenSelector } from "./TokenSelector";

function PaymentFields() {
  const { values, validateField, setFieldValue } =
    useFormikContext<DetailsStepFormValues>();
  const { updateNotaFormValues } = useNotaForm();
  const { displayNameForCurrency, getTokenUnits } = useTokens();
  const balance = useTokenBalance(values.token);
  const previousPaymentType = useRef(values.paymentType);
  const allowZero = allowsZeroPaymentAmount(values.paymentType);
  const tokenLabel = displayNameForCurrency(values.token);
  const tokenDecimals = getTokenUnits(values.token);

  useEffect(() => {
    const previousAllowsZero = allowsZeroPaymentAmount(
      previousPaymentType.current
    );
    const currentAllowsZero = allowsZeroPaymentAmount(values.paymentType);
    if (previousAllowsZero !== currentAllowsZero) {
      validateField("amount");
    }
    previousPaymentType.current = values.paymentType;
  }, [validateField, values.paymentType]);

  // Switching to a token with fewer decimals must trim the typed amount, or
  // parseUnits will throw downstream when paying / approving.
  useEffect(() => {
    const amount = values.amount ?? "";
    const dotIndex = amount.indexOf(".");
    if (dotIndex === -1) {
      return;
    }
    const fraction = amount.slice(dotIndex + 1);
    if (fraction.length <= tokenDecimals) {
      return;
    }
    const head = amount.slice(0, dotIndex);
    setFieldValue(
      "amount",
      tokenDecimals > 0 ? `${head}.${fraction.slice(0, tokenDecimals)}` : head
    );
  }, [setFieldValue, tokenDecimals, values.amount]);

  useEffect(() => {
    updateNotaFormValues({
      token: values.token,
      amount: values.amount ? String(Number(values.amount)) : "",
      address: values.address,
      resolvedAddress: values.resolvedAddress,
      mode: values.mode,
    });
  }, [
    updateNotaFormValues,
    values.token,
    values.amount,
    values.address,
    values.resolvedAddress,
    values.mode,
  ]);

  const handleMax =
    balance !== null
      ? () => setFieldValue("amount", balance)
      : undefined;

  const formattedBalance =
    balance !== null
      ? Number(balance).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })
      : "0";

  const amountValue = Number(values.amount);
  const amountNeedsValue =
    !allowZero &&
    (values.amount === undefined ||
      values.amount === "" ||
      Number.isNaN(amountValue) ||
      amountValue <= 0);

  return (
    <>
      <AccountField
        fieldName="address"
        resolvedFieldName="resolvedAddress"
        allowEns
        placeholder="almaraz.eth, 0x..."
        label="Recipient"
      />
      <FormSection
        label={
          <Flex justify="space-between" align="center" w="100%">
            <Text
              fontSize={{ base: "17px", md: "md" }}
              fontWeight={700}
              color={formTheme.text}
            >
              Amount
            </Text>
            <Text
              fontSize="12.5px"
              color={formTheme.muted}
              fontWeight={600}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Wallet size={13} style={{ marginRight: 2 }} />
              {formattedBalance} {tokenLabel}
            </Text>
          </Flex>
        }
      >
        <Flex gap={2} align="flex-start">
          <Box flex={1} minW={0}>
            <AmountField
              allowZero={allowZero}
              decimals={tokenDecimals}
              onMax={handleMax}
              invalid={amountNeedsValue}
            />
          </Box>
          <TokenSelector
            value={values.token}
            onChange={(token) => setFieldValue("token", token)}
          />
        </Flex>
        {amountNeedsValue ? (
          <Text
            id="amount-hint"
            role="alert"
            mt={1.5}
            mb={0}
            fontSize="13px"
            fontWeight={500}
            color={formTheme.error}
          >
            Enter an amount greater than 0 to send
          </Text>
        ) : null}
      </FormSection>
    </>
  );
}

export default PaymentFields;
