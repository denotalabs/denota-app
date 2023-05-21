import { Box, Text, VStack } from "@chakra-ui/react";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";
import BridgeCard from "./BridgeCard";

const BridgeStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();

  return (
    <Box w="100%" p={4}>
      <VStack gap={3}>
        <Text fontSize="xl" mb={2}>
          Your transaction will require 2 bridge transfers
        </Text>
        <BridgeCard chain="Gnosis" />
        <BridgeCard chain="ETH" />
        <RoundedButton mt={2} onClick={next}>
          {"Bridge Now"}
        </RoundedButton>
      </VStack>
    </Box>
  );
};

export default BridgeStep;
