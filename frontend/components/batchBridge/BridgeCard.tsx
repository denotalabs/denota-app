import { Box, Text, VStack } from "@chakra-ui/react";

interface Props {
  chain: string;
  token: string;
  amount: number;
}

function BridgeCard({ chain, token, amount }: Props) {
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
        <Text fontSize="xl" fontWeight={800}>
          {amount} {token} to {chain}
        </Text>
        <Text fontSize="sm">
          {chain == "Gnosis"
            ? "(Lifi, 10 USDC fee, ~15 min)"
            : "(Squid, 15 USDT fee, ~20 min)"}
        </Text>
      </VStack>
    </Box>
  );
}

export default BridgeCard;
