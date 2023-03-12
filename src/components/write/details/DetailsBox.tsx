import { Flex, FormControl, FormLabel } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";

import RoundedBox from "../../designSystem/RoundedBox";
import AccountField from "../../fields/input/AccountField";
import AmountField from "../../fields/input/AmountField";
import { DetailsStepFormValues } from "./DetailsStep";
import ModeSelect from "./ModeSelect";

interface Props {
  isInvoice: boolean;
  token: string;
  mode: string;
}

function DetailsBox({ isInvoice, token, mode }: Props) {
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
    <RoundedBox p={4} pb={6}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        <FormControl
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          w="200px"
        >
          <FormLabel>Type</FormLabel>
          <ModeSelect isInvoice={isInvoice} />
        </FormControl>
        <Flex
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <FormControl w="200px" mr={5}>
            <FormLabel>Amount</FormLabel>
            <AmountField token={token} mode={mode} />
          </FormControl>
          <AccountField fieldName="address" placeholder="0x" />
        </Flex>
      </Flex>
    </RoundedBox>
  );
}

export default DetailsBox;
