import { Box, Text, VStack } from "@chakra-ui/react";
import { ScreenProps } from "../designSystem/stepper/Stepper";
import BridgeCard from "./BridgeCard";

const BridgeStep: React.FC<ScreenProps> = () => {
  return (
    <Box w="100%" p={4}>
      <VStack gap={3}>
        <Text fontSize="xl" mb={2}>
          Your transaction will require 2 bridge transfers
        </Text>
        <BridgeCard chain="Gnosis" />
        <BridgeCard chain="ETH" />
      </VStack>
    </Box>
  );
};

export default BridgeStep;
