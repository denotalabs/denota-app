import { Box, Center, Text } from "@chakra-ui/react";

// TODO update this
function NewUserScreen() {
  return (
    <Box w="100%">
      <Center flexDirection={"column"} w="100%" px={5}>
        <Text fontSize="2xl" textAlign="center">
          Hola from Denota!
          This is the open mainnet beta for Denota!
          Denota allows, for the first time, crypto payments with protections, metadata (and more!)  built-in.
          Dashboard is where you can see all your transactions and the details of each one.
          New Nota is where you can send a new payment to someone.
          Each payment is represented by a Nota, which is an NFT that holds the funds and enforces the payment terms.
          Connect your wallet using the top right button and make sure you're on Polygon mainnet to start sending and receiving!
          (We are competent devs but Denota has not been formally audited so use at your own risk.)
        </Text>
      </Center>
    </Box>
  );
}

export default NewUserScreen;
