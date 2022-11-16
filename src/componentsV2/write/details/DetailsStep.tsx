import { Box } from "@chakra-ui/react";
import CurrencySelector from "./CurrencySelector";
import DetailsBox from "./DetailsBox";
import RoundedButton from "../RoundedButton";
import { useStep } from "../../stepper/Stepper";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqDetailsStep({ isInvoice }: Props) {
  const { next } = useStep();
  return (
    <Box w="100%" p={4}>
      <CurrencySelector></CurrencySelector>
      <DetailsBox></DetailsBox>
      <RoundedButton
        onClick={() => {
          next?.();
        }}
      >
        {"Next"}
      </RoundedButton>
    </Box>
  );
}

export default CheqDetailsStep;
