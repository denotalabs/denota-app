import { Box, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useNotaForm } from "../../context/NotaFormProvider";
import { DataMap } from "../../hooks/batch/useBatchPaymentReader";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";
import BridgeCard from "./BridgeCard";

interface BridgeDestinations {
  chain: string;
  token: string;
  amount: number;
}

const BridgeStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const { notaFormValues } = useNotaForm();

  const bridgeDestinations = useMemo(() => {
    const bridgeData = notaFormValues.data as DataMap;
    const chains = Object.keys(bridgeData);

    const outputMap = {};

    for (const chain of chains) {
      const rows = bridgeData[chain];
      for (const row of rows) {
        const tokenChainKey = row.token + "|" + chain;

        if (tokenChainKey in outputMap) {
          outputMap[tokenChainKey] += row.amount;
        } else {
          outputMap[tokenChainKey] = row.amount;
        }
      }
    }

    const tokenChainKeys = Object.keys(outputMap);

    const outputList: BridgeDestinations[] = [];

    for (const tokenChain in tokenChainKeys) {
      const [token, chain] = tokenChain.split("|");
      outputList.push({ token, chain, amount: outputMap[tokenChain] });
    }

    return outputList;
  }, [notaFormValues.data]);

  return (
    <Box w="100%" p={4}>
      <VStack gap={3}>
        <Text fontSize="xl" mb={2}>
          Your transaction will require 2 bridge transfers
        </Text>
        {bridgeDestinations.map((bridgeDestination) => (
          <BridgeCard {...bridgeDestination} />
        ))}
        <RoundedButton mt={2} onClick={next}>
          {"Bridge Now"}
        </RoundedButton>
      </VStack>
    </Box>
  );
};

export default BridgeStep;
