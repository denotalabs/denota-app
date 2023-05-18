import { Text, VStack } from "@chakra-ui/react";
import RoundedButton from "../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../designSystem/stepper/Stepper";

const UploadCSVStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();

  return (
    <VStack w="100%" p={4}>
      <Text textAlign="center">Format:</Text>
      <Text textAlign="center" pb={5} fontWeight={600}>
        payee,amount,token,dest_chain
      </Text>
      <RoundedButton type="submit" onClick={next}>
        {"Upload CSV"}
      </RoundedButton>
    </VStack>
  );
};

export default UploadCSVStep;
