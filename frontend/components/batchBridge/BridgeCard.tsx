import { CheckIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
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
  const jumperLink = `https://jumper.exchange/?fromAmount=${amount}&fromChain=${parseInt(
    blockchainState.chainId,
    16
  )}&fromToken=${tokenAddress}&toChain=${chainId}&toToken=${tokenAddress}`;

  const [wasOpened, setWasOpened] = useState(false);

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
            console.log({ jumperLink });
            setWasOpened(true);
            window.open(jumperLink, "_blank");
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
