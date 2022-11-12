import { Box, Center, Text } from "@chakra-ui/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

function Reputation() {
  const blockchainState = useBlockchainData();

  return (
    <Box bg='cadetblue' height={16} width='100%'>
      <Center>
        <Text>Total cheqs written: {blockchainState.cheqTotalSupply}</Text>
      </Center>
    </Box>
  );
}

export default Reputation;
