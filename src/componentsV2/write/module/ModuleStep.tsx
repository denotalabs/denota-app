import { Box, Button, Text } from "@chakra-ui/react";
import { useStep } from "../../stepper/Stepper";
import RoundedButton from "../RoundedButton";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqModuleStep({ isInvoice }: Props) {
  const { next } = useStep();

  return (
    <Box w="100%" p={4}>
      <Box bg="gray.700" borderRadius="10px" h="350px" p={3}>
        <Text fontWeight={600} fontSize={"lg"}>
          {"Module"}
        </Text>
      </Box>
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
