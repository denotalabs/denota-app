import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useTokens } from "../../hooks/useTokens";

interface Props {
  chainDisplayName: string;
  token: string;
  amount: number;
  chainId: number;
}

function BridgeCard({ chainDisplayName, token, amount, chainId }: Props) {
  const { getTokenAddress } = useTokens();
  const { blockchainState } = useBlockchainData();

  const tokenAddress = useMemo(
    () => getTokenAddress(token),
    [getTokenAddress, token]
  );

  // TODO: figure out token address on dest chain
  const jumperLink = `https://jumper.exchange/?fromAmount=${amount}&fromChain=${blockchainState.chainId}&fromToken=${tokenAddress}&toChain=${chainId}&toToken=${tokenAddress}`;

  const [wasOpened, setWasOpened] = useState(false);

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
        {wasOpened && <Text fontSize="sm">You opened this link</Text>}
        <Button
          variant="outline"
          w="min(40vw, 100px)"
          borderRadius={5}
          colorScheme="white"
          onClick={() => {
            setWasOpened(true);
            window.open(jumperLink, "_blank");
          }}
        >
          Bridge now
        </Button>
      </VStack>
    </Box>
  );
}

export default BridgeCard;
