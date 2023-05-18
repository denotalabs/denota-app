import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { useStep } from "../designSystem/stepper/Stepper";

interface Props {
  chain: string;
}

function BridgeCard({ chain }: Props) {
  const { next } = useStep();

  return (
    <Box
      w="285px"
      h="160px"
      bg={
        chain === "Gnosis"
          ? "linear-gradient(180deg, #6E7C9A, #202C4F)"
          : "linear-gradient(180deg, #343C9B, #292D5D)"
      }
      borderRadius={20}
      px={6}
      pt={4}
      pb={3}
    >
      <VStack gap={3}>
        <Text>3000 USDC to {chain}</Text>
        <Text>
          {chain == "Gnosis"
            ? "(Lifi, 10 USDC fee, ~15 min)"
            : "(Squid, 15 USDT fee, ~20 min)"}
        </Text>
        <Button
          variant="outline"
          w="min(40vw, 100px)"
          borderRadius={5}
          colorScheme="white"
          onClick={next}
        >
          Bridge now
        </Button>
      </VStack>
    </Box>
  );
}

export default BridgeCard;
