import { Box, Button, Text, VStack } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useTokens } from "../../hooks/useTokens";
import { LifiWidget } from "../LifiWidget";
export const LiFiWidgetNext = dynamic(
  () => import("../LifiWidget").then((module) => module.LifiWidget) as any,
  {
    ssr: false,
    loading: () => <></>,
  }
);

interface Props {
  chainDisplayName: string;
  token: string;
  amount: number;
  toChainId: number;
}

function BridgeCard({ chainDisplayName, token, amount, toChainId }: Props) {
  const { getTokenAddress } = useTokens();
  const { blockchainState } = useBlockchainData();

  const fromChainId = parseInt(blockchainState.chainId, 16);

  const fromTokenAddress = useMemo(
    () => getTokenAddress(token, fromChainId),
    [fromChainId, getTokenAddress, token]
  );

  const toTokenAddress = useMemo(
    () => getTokenAddress(token, toChainId),
    [getTokenAddress, toChainId, token]
  );

  // TODO: figure out token address on dest chain
  const jumperLink = `https://jumper.exchange/?fromAmount=${amount}&fromChain=${fromChainId}&fromToken=${fromTokenAddress}&toChain=${toChainId}&toToken=${toTokenAddress}`;

  const [wasOpened, setWasOpened] = useState(false);

  return (
    <Box
      w="285px"
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
            setWasOpened(true);
            // window.open(jumperLink, "_blank");
          }}
        >
          Bridge now
        </Button>
        {wasOpened && <LifiWidget />}
      </VStack>
    </Box>
  );
}

export default BridgeCard;
