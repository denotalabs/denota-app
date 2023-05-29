import { Box, VStack } from "@chakra-ui/react";
import { ScreenProps } from "../designSystem/stepper/Stepper";
import DisperseDetails from "./DisperseDetails";

const DisperseStep: React.FC<ScreenProps> = () => {
  return (
    <Box w="100%" p={4}>
      <VStack gap={3}>
        <DisperseDetails chainId={80001} />
        <DisperseDetails chainId={1} />
      </VStack>
    </Box>
  );
};

export default DisperseStep;
