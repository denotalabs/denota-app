import { Box, Center, Text } from "@chakra-ui/react";

function NewUserScreen() {
  return (
    <Box w="100%">
      <Center flexDirection={"column"} w="100%" px={5}>
        <Text fontSize="2xl" textAlign="center">
          Hola from Denota! Connect your wallet using the top right button and
          make sure you're on Polygon mainnet
        </Text>
      </Center>
    </Box>
  );
}

export default NewUserScreen;
