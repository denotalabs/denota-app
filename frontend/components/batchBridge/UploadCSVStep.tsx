import { Box, Text } from "@chakra-ui/react";
import RoundedButton from "../designSystem/RoundedButton";

const UploadCSVStep = () => {
  return (
    <Box w="100%" p={4}>
      <Text textAlign="center">Upload a CSV to get started</Text>
      <Text textAlign="center">payee,amount,token,dest_chain</Text>
      <RoundedButton mt={2} type="submit">
        {"Upload CSV"}
      </RoundedButton>
    </Box>
  );
};

export default UploadCSVStep;
