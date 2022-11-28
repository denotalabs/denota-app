import { Box, Text } from "@chakra-ui/react";
import RoundedBox from "../../designSystem/RoundedBox";

function CheqDetails() {
  return (
    <Box w="100%" p={4}>
      <RoundedBox mt={8} p={6}>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center">
          {"Information about the cheq module"}
        </Text>
      </RoundedBox>
    </Box>
  );
}

export default CheqDetails;
