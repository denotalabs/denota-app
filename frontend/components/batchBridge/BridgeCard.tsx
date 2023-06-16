import { CheckIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { Route } from "@lifi/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useTokens } from "../../hooks/useTokens";

interface Props {
  chainDisplayName: string;
  token: string;
  amount: number;
  toChainId: number;
}

function BridgeCard({ chainDisplayName, token, amount, toChainId }: Props) {
  const { getTokenAddress } = useTokens();
  const { blockchainState } = useBlockchainData();
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);

  const tokenAddress = useMemo(
    () => getTokenAddress(token),
    [getTokenAddress, token]
  );

  const fromChainId = useMemo(
    () => parseInt(blockchainState.chainId, 16),
    [blockchainState.chainId]
  );

  // TODO: figure out token address on dest chain
  const jumperLink = `https://jumper.exchange/?fromAmount=${amount}&fromChain=${fromChainId}&fromToken=${tokenAddress}&toChain=${toChainId}&toToken=${tokenAddress}`;

  const [wasOpened, setWasOpened] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      const result = await blockchainState.lifi.getRoutes({
        fromChainId,
        fromAmount: String(amount), // TODO: convert exponent
        fromTokenAddress: tokenAddress,
        toChainId,
        toTokenAddress: tokenAddress,
        options: {
          slippage: 3 / 100, // 3%
          order: "RECOMMENDED",
        },
      });

      setRoutes(result.routes);
    };

    fetchRoutes();
  }, [amount, blockchainState.lifi, fromChainId, toChainId, tokenAddress]);

  const updateCallback = (updatedRoute: Route) => {
    console.log("Ping! Everytime a status update is made!");
  };

  const execute = useCallback(async () => {
    const route = await blockchainState.lifi.executeRoute(
      blockchainState.signer,
      routes[0],
      { ...updateCallback }
    );
    setCurrentRoute(route);
  }, [blockchainState.lifi, blockchainState.signer, routes]);

  return (
    <Box
      w="285px"
      h="180px"
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
        <Button
          variant="outline"
          w="min(40vw, 100px)"
          borderRadius={5}
          colorScheme="white"
          onClick={() => {
            // Jumper route
            setWasOpened(true);
            window.open(jumperLink, "_blank");

            // LIFI route
            // await execute();
          }}
        >
          Bridge now
        </Button>
        {wasOpened && (
          <HStack>
            <Text fontSize="sm">You opened this link</Text>
            <CheckIcon boxSize={4} />
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

export default BridgeCard;
