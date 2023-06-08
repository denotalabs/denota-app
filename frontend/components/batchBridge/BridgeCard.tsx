import { Box, Text, VStack } from "@chakra-ui/react";

interface Props {
  chainDisplayName: string;
  token: string;
  amount: number;
}

function BridgeCard({ chainDisplayName, token, amount }: Props) {
  return (
    <Box
      w="285px"
      h="160px"
      bg={
        chainDisplayName === "Gnosis"
          ? "linear-gradient(180deg, #6E7C9A, #202C4F)"
          : "linear-gradient(180deg, #343C9B, #292D5D)"
      }
      borderRadius={20}
      px={6}
      pt={4}
      pb={3}
    >
      <VStack gap={3}>
        <Text fontSize="xl" textAlign="center" fontWeight={800}>
          {amount} {token} to {chainDisplayName}
        </Text>
        <Text fontSize="sm">
          {chainDisplayName == "Gnosis"
            ? "(Lifi, 10 USDC fee, ~15 min)"
            : "(Squid, 15 USDT fee, ~20 min)"}
        </Text>
      </VStack>
    </Box>
  );
}

export default BridgeCard;
