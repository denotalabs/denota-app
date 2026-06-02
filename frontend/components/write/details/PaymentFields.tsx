import { Flex, FormControl, FormLabel } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import AccountField from "../../fields/input/AccountField";

import AmountField from "../../fields/input/AmountField";
import { DetailsStepFormValues } from "./DetailsStep";

interface Props {
  token: string;
  mode: string;
}

function PaymentFields({ token, mode }: Props) {
  const { values } = useFormikContext<DetailsStepFormValues>();
  const { updateNotaFormValues } = useNotaForm();

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
        <FormLabel mb={2}>Amount</FormLabel>
        <AmountField token={token} mode={mode} />
      </FormControl>
    </Flex>
  );
}

export default PaymentFields;
