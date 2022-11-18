import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Grid,
  GridItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Text,
} from "@chakra-ui/react";
import CheqCardV2 from "./CheqCardV2";

function MyCheqsView() {
  // TODO (Integrate v2 UI with v2 smart contract): Load cheqs from graph
  return (
    <Box boxShadow="outline" width="100%" p={6} borderRadius={"10px"}>
      <Select
        defaultValue="tokensReceived"
        minW={0}
        mb={6}
        w="120px"
        onChange={(event) => {
          console.log(event.target.value);
          // setTokenSelect(event.target.value)
        }}
      >
        <option value="tokensOwned">Owned</option>
        <option value="tokensSent">Sent</option>
        <option value="tokensReceived">Received</option>
        <option value="tokensCashed">Cashed</option>
        <option value="tokensVoided">Voided</option>
      </Select>
      <Grid templateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap={6}>
        <CheqCardV2
          sender="Cheq 1"
          status="Cashable"
          token="USDC"
          amount="1000"
        />
        <CheqCardV2
          sender="Cheq 2"
          status="Cashable"
          token="USDC"
          amount="500"
        />
        <CheqCardV2
          sender="Cheq 3"
          status="Cashable"
          token="USDC"
          amount="900"
        />
        <CheqCardV2
          sender="Cheq 4"
          status="Cashable"
          token="USDC"
          amount="250"
        />
      </Grid>
    </Box>
  );
}

export default MyCheqsView;
