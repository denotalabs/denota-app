import { Box, Button, Spinner, Text, VStack } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { ComponentType, useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useTokens } from "../../hooks/useTokens";
import { LifiWidgetProps } from "../LifiWidget";
export const LiFiWidgetNext: ComponentType<LifiWidgetProps> = dynamic(
  () => import("../LifiWidget").then((module) => module.LifiWidget) as any,
  {
    ssr: false,
    loading: () => <Spinner size="md" />,
  }
);

interface Props {
  chainDisplayName: string;
  token: string;
  amount: number;
  toChainId: number;
}

function BridgeCard({
  chainDisplayName,
  token,
  amount,
  toChainId: toChain,
}: Props) {
  const { getTokenAddress } = useTokens();
  const { blockchainState } = useBlockchainData();

  const fromChain = parseInt(blockchainState.chainId, 16);

  const fromToken = useMemo(
    () => getTokenAddress(token, fromChain),
    [fromChain, getTokenAddress, token]
  );

  const toToken = useMemo(
    () => getTokenAddress(token, toChain),
    [getTokenAddress, toChain, token]
  );

  // TODO: figure out token address on dest chain
  const jumperLink = `https://jumper.exchange/?fromAmount=${amount}&fromChain=${fromChain}&fromToken=${fromToken}&toChain=${toChain}&toToken=${toToken}`;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box
      w="500px"
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
          w="min(45vw, 150px)"
          borderRadius={5}
          colorScheme="white"
          onClick={() => {
            setIsOpen(!isOpen);
            // window.open(jumperLink, "_blank");
          }}
        >
          {isOpen ? "Hide" : "Show"} widget
        </Button>
        {isOpen && (
          <LiFiWidgetNext
            fromChain={fromChain}
            toChain={toChain}
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={amount}
          />
        )}
      </VStack>
    </Box>
  );
}

export default BridgeCard;
