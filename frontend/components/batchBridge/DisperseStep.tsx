import { Box, VStack } from "@chakra-ui/react";
import { useNotaForm } from "../../context/NotaFormProvider";
import { BatchDataMap } from "../../hooks/batch/useBatchPaymentReader";
import { ScreenProps } from "../designSystem/stepper/Stepper";
import DisperseDetails from "./DisperseDetails";

const DisperseStep: React.FC<ScreenProps> = () => {
  const { notaFormValues } = useNotaForm();
  const bridgeData = notaFormValues.data as BatchDataMap;
  const bridgeDataKeys = Object.keys(bridgeData);

  return (
    <Box w="100%" p={4}>
      <VStack gap={3}>
        {bridgeDataKeys.map((chainId, index) => (
          <DisperseDetails
            key={index}
            chainId={Number(chainId)}
            data={bridgeData[chainId]}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default DisperseStep;
