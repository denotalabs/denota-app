import { Text, VStack } from "@chakra-ui/react";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";

const UploadCSVStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();

  return (
    <VStack w="100%" p={4}>
      <Text textAlign="center">Upload a CSV to get started</Text>
      <Text textAlign="center">payee,amount,token,dest_chain</Text>
      <RoundedButton mt={2} type="submit" onClick={next}>
        {"Upload CSV"}
      </RoundedButton>
    </VStack>
  );
};

export default UploadCSVStep;
