import { Box, Center, Text } from "@chakra-ui/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

function Reputation() {
  // TODO (Integrate v2 UI with v2 smart contract): Load recent contacts from graph
  const blockchainState = useBlockchainData();

  return (
    <Box bg="cadetblue" height={16} width="100%">
      <Center>
        <Text fontSize={"lg"} fontWeight={400}>
          Total cheqs written: {blockchainState.cheqTotalSupply}
        </Text>
      </Center>
    </Box>
  );
}

export default Reputation;
