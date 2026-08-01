import { Box, Flex, Text, useBreakpointValue } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { Wallet } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import AccountField from "../../fields/input/AccountField";
import AmountField from "../../fields/input/AmountField";
import {
  displayNameForCurrency,
  NotaCurrency,
} from "../../designSystem/CurrencyIcon";
import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";
import { DetailsStepFormValues } from "./DetailsStepForm";
import { allowsZeroPaymentAmount } from "./paymentMetadata";

function PaymentFields() {
  const isDesktop = useBreakpointValue({ base: false, md: true }) ?? false;
  const { values, setFieldTouched, validateField, setFieldValue } =
    useFormikContext<DetailsStepFormValues>();
  const { updateNotaFormValues } = useNotaForm();
  const balance = useTokenBalance(values.token as NotaCurrency);
  const previousPaymentType = useRef(values.paymentType);
  const allowZero = allowsZeroPaymentAmount(values.paymentType);
  const amountLabel =
    values.paymentType === "withTerms" ? "Escrow amount" : "Amount";
  const tokenLabel = displayNameForCurrency(values.token as NotaCurrency);

  useEffect(() => {
    const previousAllowsZero = allowsZeroPaymentAmount(
      previousPaymentType.current
    );
    const currentAllowsZero = allowsZeroPaymentAmount(values.paymentType);
    if (previousAllowsZero !== currentAllowsZero) {
      setFieldTouched("amount", true, false);
      validateField("amount");
    }
    previousPaymentType.current = values.paymentType;
  }, [setFieldTouched, validateField, values.paymentType]);

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
      : null;

  const amountSection = (
    <FormSection
      mb={0}
      label={
        <Flex justify="space-between" align="center" w="100%">
          <Text
            fontSize={{ base: "17px", md: "md" }}
            fontWeight={700}
            color={formTheme.text}
          >
            {amountLabel}
          </Text>
          {formattedBalance ? (
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
          ) : null}
        </Flex>
      }
    >
      <AmountField
        allowZero={allowZero}
        tokenLabel={tokenLabel}
        onMax={handleMax}
      />
    </FormSection>
  );

  if (isDesktop) {
    return (
      <Flex gap={3} align="flex-start" mb={5}>
        <Box flex={1} minW={0}>
          <AccountField
            fieldName="address"
            resolvedFieldName="resolvedAddress"
            allowEns
            placeholder="almaraz.eth, 0x..."
            label="Recipient Address"
            sectionMb={0}
          />
        </Box>
        <Box flex={1} minW={0}>
          {amountSection}
        </Box>
      </Flex>
    );
  }

  return (
    <>
      <AccountField
        fieldName="address"
        resolvedFieldName="resolvedAddress"
        allowEns
        placeholder="almaraz.eth, 0x..."
        label="Recipient Address"
      />
      {amountSection}
    </>
  );
}

export default PaymentFields;
