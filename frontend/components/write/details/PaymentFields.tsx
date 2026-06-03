import { Flex, FormControl, FormLabel } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useEffect, useRef } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import AccountField from "../../fields/input/AccountField";

import AmountField from "../../fields/input/AmountField";
import { DetailsStepFormValues } from "./DetailsStep";

interface Props {
  token: string;
  mode: string;
}

function PaymentFields({ token, mode }: Props) {
  const { values, setFieldTouched, validateField } =
    useFormikContext<DetailsStepFormValues>();
  const { updateNotaFormValues } = useNotaForm();
  const previousPaymentType = useRef(values.paymentType);
  const allowZero = values.paymentType === "withTerms";
  const amountLabel = allowZero ? "Escrow amount" : "Amount";

  useEffect(() => {
    if (
      previousPaymentType.current === "withTerms" &&
      values.paymentType !== "withTerms"
    ) {
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

  return (
    <Flex
      gap="18px"
      direction="row"
      mt={5}
      w="100%"
      align="flex-start"
      flexWrap={{ base: "wrap", md: "nowrap" }}
    >
      <FormControl flex={1} minW={0}>
        <FormLabel mb={2}>Recipient Address</FormLabel>
        <AccountField
          fieldName="address"
          resolvedFieldName="resolvedAddress"
          allowEns
          placeholder="almaraz.eth, 0x..."
        />
      </FormControl>
      <FormControl flexShrink={0} w={{ base: "100%", md: "200px" }}>
        <FormLabel mb={2}>{amountLabel}</FormLabel>
        <AmountField token={token} mode={mode} allowZero={allowZero} />
      </FormControl>
    </Flex>
  );
}

export default PaymentFields;
