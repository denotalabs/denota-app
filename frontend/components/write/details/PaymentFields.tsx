import { QuestionOutlineIcon } from "@chakra-ui/icons";
import { Flex, FormControl, FormLabel, Tooltip } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import AccountField from "../../fields/input/AccountField";

import AmountField from "../../fields/input/AmountField";
import { DetailsStepFormValues } from "./DetailsStep";
import ModeSelect from "./ModeSelect";

interface Props {
  token: string;
  mode: string;
}

function PaymentFields({ token, mode }: Props) {
  const { values } = useFormikContext<DetailsStepFormValues>();
  const { appendFormData } = useNotaForm();

  useEffect(() => {
    const { token, amount, address, mode } = values;
    appendFormData({
      token,
      amount: amount ? String(Number(amount)) : "",
      address,
      mode,
    });
  }, [appendFormData, values]);

  return (
    <Flex flexWrap={"wrap"} gap={"18px"} direction={"row"} mt={5}>
      <FormControl
        alignItems={"center"}
        justifyContent={"space-between"}
        flexShrink={0}
        w="200px"
      >
        <FormLabel>
          Type
          <Tooltip
            label={
              values.mode === "invoice"
                ? "Invoice is a request for payment"
                : "Payment is a direct transfer of funds"
            }
            aria-label="module tooltip"
            placement="right"
          >
            <QuestionOutlineIcon ml={2} mb={1} />
          </Tooltip>
        </FormLabel>
        <ModeSelect />
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
