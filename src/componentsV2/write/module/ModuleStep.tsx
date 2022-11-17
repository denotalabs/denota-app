import { Box, Button, Text } from "@chakra-ui/react";
import { useStep } from "../../stepper/Stepper";
import RoundedButton from "../RoundedButton";
import ModuleSelect from "./ModuleSelect";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqModuleStep({ isInvoice }: Props) {
  const { next } = useStep();

  return (
    <Box w="100%" p={4}>
      <ModuleSelect />
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

export default CheqModuleStep;
