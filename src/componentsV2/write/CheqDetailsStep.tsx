import { Box, Button, Flex, FormLabel } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import AccountField from "../../components/input/AccountField";
import AmountField from "../../components/input/AmountField";
import TokenField from "../../components/input/TokenField";
import { useStep } from "../stepper/Stepper";
import CurrencySelector from "./details/CurrencySelector";
import DetailsBox from "./details/DetailsBox";
import RoundedButton from "./RoundedButton";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

// screenKey used in stepper flow
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CheqDetailsStep({ isInvoice }: Props) {
  return (
    <Box w="100%" p={6}>
      <DetailsBox></DetailsBox>
      <CurrencySelector></CurrencySelector>
      <RoundedButton></RoundedButton>
    </Box>
  );
}

export default CheqDetailsStep;
