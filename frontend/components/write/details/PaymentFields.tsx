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
    const { token, amount, address, mode } = values;
    updateNotaFormValues({
      token,
      amount: amount ? String(Number(amount)) : "",
      address,
      mode,
    });
  }, [updateNotaFormValues, values]);

  return (
    <Flex gap={"18px"} direction={"row"} mt={5}>
      <FormControl flexShrink={1}>
        <FormLabel mb={2}>Recipient Address</FormLabel>
        <AccountField fieldName="address" placeholder="0x..." />
      </FormControl>
      <Flex justifyContent="space-between" flexShrink={0} maxW="100%">
        <FormControl w="200px" mr={5}>
          <FormLabel>Amount</FormLabel>
          <AmountField token={token} mode={mode} />
        </FormControl>
      </Flex>
    </Flex>
  );
}

export default PaymentFields;
