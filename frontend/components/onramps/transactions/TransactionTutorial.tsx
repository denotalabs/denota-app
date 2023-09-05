import { Box, Text, VStack } from "@chakra-ui/react";

function TransactionTutorial() {
  return (
    <VStack w="300px" bg="brand.100" py={5} px={4} borderRadius="30px">
      <Box w="100%" p={4}>
        <Text pb={4}>
          A simple call to Denota's Transaction API adds coverage to a user
          crypto purchases/withdrawals.
        </Text>
        <Text py={4}>
          Once the transaction is covered, your onramp will be able to recover
          funds in the case of a chargeback.
        </Text>
        <Text py={4}>
          Simulate a user withdrawal below to see Denota's coverage in action.
        </Text>
      </Box>
    </VStack>
  );
}

export default TransactionTutorial;
