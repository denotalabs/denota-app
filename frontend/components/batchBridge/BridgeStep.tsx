import { Box } from "@chakra-ui/react";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";

const BridgeStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();

  return (
    <Box w="100%" p={4}>
      <RoundedButton mt={2} type="submit" onClick={next}>
        {"Next"}
      </RoundedButton>
    </Box>
  );
};

export default BridgeStep;
