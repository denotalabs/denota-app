import { Box, Text } from "@chakra-ui/react";
import RoundedBox from "../../designSystem/RoundedBox";
import RoundedButton from "../../designSystem/RoundedButton";

function ApproveAndPay() {
  return (
    <Box w="100%" p={4}>
      <RoundedBox mt={8} p={6}>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center">
          {"You have 30 days to request a refund"}
        </Text>
      </RoundedBox>
      <RoundedButton>{"Pay"}</RoundedButton>
    </Box>
  );
}

export default ApproveAndPay;
