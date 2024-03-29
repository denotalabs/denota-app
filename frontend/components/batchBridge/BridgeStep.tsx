import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  chainInfoForChainId,
  chainNumberToChainHex,
  deployedChains,
} from "../../context/chainInfo";
import { useNotaForm } from "../../context/NotaFormProvider";
import { switchNetwork } from "../../context/SwitchNetwork";
import { BatchDataMap } from "../../hooks/batch/useBatchPaymentReader";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";
import BridgeCard from "./BridgeCard";

interface BridgeDestinations {
  chainDisplayName: string;
  token: string;
  amount: number;
  toChainId: number;
}

const BridgeStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const originChainId = notaFormValues.originChainId as string;

  const originChainName = useMemo(() => {
    return deployedChains[originChainId].displayName;
  }, [originChainId]);

  const switchToOriginChain = useCallback(async () => {
    await switchNetwork(originChainId);
  }, [originChainId]);

  const bridgeDestinations = useMemo(() => {
    const bridgeData = notaFormValues.data as BatchDataMap;
    const chains = Object.keys(bridgeData);

    const outputMap = {};

    for (const chain of chains) {
      // TODO: skip if dest chain already has sufficient balance
      // TODO: show indicator if no bridging required

      const rows = bridgeData[chain];
      for (const row of rows) {
        if (blockchainState.chainId !== chainNumberToChainHex(Number(chain))) {
          const tokenChainKey = row.token + "|" + chain;

          if (tokenChainKey in outputMap) {
            outputMap[tokenChainKey] += row.value;
          } else {
            outputMap[tokenChainKey] = row.value;
          }
        }
      }
    }

    const tokenChainKeys = Object.keys(outputMap);

    const outputList: BridgeDestinations[] = [];

    for (const tokenChain of tokenChainKeys) {
      const [token, chainId] = tokenChain.split("|");
      const chainInfo = chainInfoForChainId(Number(chainId));
      const chainDisplayName = chainInfo
        ? chainInfo.displayName
        : "UNRECOGNIZED CHAIN";

      outputList.push({
        token,
        chainDisplayName,
        amount: outputMap[tokenChain],
        toChainId: Number(chainId),
      });
    }

    return outputList;
  }, [blockchainState.chainId, notaFormValues.data]);

  return (
    <Box w="100%" p={4}>
      <VStack gap={3}>
        <Text fontSize="xl" mb={2}>
          {`Your transaction will require ${bridgeDestinations.length} bridge transfers`}
        </Text>
        {originChainId === blockchainState.chainId ? (
          bridgeDestinations.map((bridgeDestination, index) => (
            <BridgeCard key={index} {...bridgeDestination} />
          ))
        ) : (
          <Button
            bg="brand.300"
            color="brand.200"
            onClick={() => {
              switchToOriginChain();
            }}
          >
            {`Switch back to ${originChainName}`}
          </Button>
        )}
        <RoundedButton mt={2} onClick={next}>
          {"Next"}
        </RoundedButton>
      </VStack>
    </Box>
  );
};

export default BridgeStep;
