import { Box, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  chainInfoForChainId,
  chainNumberToChainHex,
} from "../../context/chainInfo";
import { useNotaForm } from "../../context/NotaFormProvider";
import { BatchDataMap } from "../../hooks/batch/useBatchPaymentReader";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";
import BridgeCard from "./BridgeCard";

interface BridgeDestinations {
  chainDisplayName: string;
  token: string;
  amount: number;
}

const BridgeStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const bridgeDestinations = useMemo(() => {
    const bridgeData = notaFormValues.data as BatchDataMap;
    const chains = Object.keys(bridgeData);

    const outputMap = {};

    for (const chain of chains) {
      // TODO: skip origin chain
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
      const chainDisplayName = chainInfoForChainId(Number(chainId)).displayName;
      outputList.push({
        token,
        chainDisplayName,
        amount: outputMap[tokenChain],
      });
    }

    return outputList;
  }, [blockchainState.chainId, notaFormValues.data]);

  return (
    <Box w="100%" p={4}>
      <VStack gap={3}>
        <Text fontSize="xl" mb={2}>
          Your transaction will require 2 bridge transfers
        </Text>
        {bridgeDestinations.map((bridgeDestination, index) => (
          <BridgeCard key={index} {...bridgeDestination} />
        ))}
        <RoundedButton mt={2} onClick={next}>
          {"Bridge Now"}
        </RoundedButton>
      </VStack>
    </Box>
  );
};

export default BridgeStep;
