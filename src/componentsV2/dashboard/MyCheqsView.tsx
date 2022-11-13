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
  Text,
} from "@chakra-ui/react";
import CheqCardV2 from "./CheqCardV2";

function MyCheqsView() {
  // TODO (Integrate v2 UI with v2 smart contract): Load cheqs from graph
  return (
    <Box boxShadow="outline" width="100%" p={6}>
      <Menu>
        <MenuButton
          as={Button}
          cursor={"pointer"}
          minW={0}
          mb={6}
          rightIcon={<ChevronDownIcon />}
        >
          Received
        </MenuButton>
        <MenuList alignItems={"center"}>
          <MenuItem>Owned</MenuItem>
          <MenuItem>Sent</MenuItem>
          <MenuItem>Received</MenuItem>
          <MenuItem>Cashed</MenuItem>
          <MenuItem>Voided</MenuItem>
        </MenuList>
      </Menu>
      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
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
