import { InputGroup, Text, VStack } from "@chakra-ui/react";
import { ChangeEvent, useRef } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useNotaForm } from "../../context/NotaFormProvider";
import useBatchPaymentReader from "../../hooks/batch/useBatchPaymentReader";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";

const UploadCSVStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { handleFileRead } = useBatchPaymentReader();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const { blockchainState } = useBlockchainData();

  const { updateNotaFormValues } = useNotaForm();

  const handleChange = async (value: ChangeEvent<HTMLInputElement>) => {
    if (value.target.files?.[0] && value.target.files?.[0].size < 5000000) {
      try {
        const data = await handleFileRead(value.target.files?.[0]);
        updateNotaFormValues({ data, originChainId: blockchainState.chainId });
        next();
      } catch (e) {
        console.log(e);
        inputRef.current.value = "";
      }
    }
  };

  return (
    <VStack w="100%" p={4}>
      <Text textAlign="center">Format:</Text>
      <Text textAlign="center" pb={5} fontWeight={600}>
        payee,amount,token,dest_chain
      </Text>
      <InputGroup onClick={handleClick}>
        <input
          onChange={handleChange}
          type="file"
          accept=".csv"
          multiple={false}
          id={"batch"}
          ref={inputRef}
          hidden
        />
        <RoundedButton type="submit">{"Upload CSV"}</RoundedButton>
      </InputGroup>
    </VStack>
  );
};

export default UploadCSVStep;
