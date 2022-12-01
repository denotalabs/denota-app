import { Box, Text } from "@chakra-ui/react";
import RoundedBox from "../../designSystem/RoundedBox";

function CheqDetails() {
  return (
    <RoundedBox mt={8} p={4}>
      <Text fontWeight={600} fontSize={"xl"} textAlign="center">
        {"Information about the cheq module"}
      </Text>
    </RoundedBox>
  );
}

export default CheqDetails;
