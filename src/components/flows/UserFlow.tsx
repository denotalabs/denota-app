import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  Button,
  MenuList,
  MenuButton,
  MenuItem,
} from "@chakra-ui/react";

import CashTab from "../CashTab";
import WriteTab from "../WriteTab";
import AuditorsTab from "../AuditorsTab";
import { useState } from "react";
import { ChevronDownIcon } from "@chakra-ui/icons";

function UserFlow() {
  const [isTokenSelect, setTokenSelect] = useState("tokensOwned"); // tokensOwned, tokensSent, tokensAuditing, tokensReceived, tokensCashed, tokensVoided
  // const [isSort, setIsSort] = useState("asc");  // asc, desc
  return (
    <Tabs>
      <TabList>
        {/* <Tab key={0}>Deposit</Tab> */}
        <Tab key={1}>Write Cheq</Tab>
        <Tab key={2}>My Cheqs</Tab>
        <Tab key={3}>My Auditors</Tab>
      </TabList>

      <TabPanels>
        <TabPanel key={1}>
          <WriteTab />
        </TabPanel>
        <TabPanel key={2}>
          <Menu>
            <MenuButton
              as={Button}
              cursor={"pointer"}
              minW={0}
              my={3}
              rightIcon={<ChevronDownIcon />}
            >
              Filter
            </MenuButton>
            <MenuList alignItems={"center"}>
              <MenuItem onClick={() => setTokenSelect("tokensOwned")}>
                Owned
              </MenuItem>
              <MenuItem onClick={() => setTokenSelect("tokensSent")}>
                Sent
              </MenuItem>
              <MenuItem onClick={() => setTokenSelect("tokensReceived")}>
                Received
              </MenuItem>
              <MenuItem onClick={() => setTokenSelect("tokensCashed")}>
                Cashed
              </MenuItem>
              <MenuItem onClick={() => setTokenSelect("tokensVoided")}>
                Voided
              </MenuItem>
            </MenuList>
          </Menu>
          <CashTab isTokenSelect={isTokenSelect} />
        </TabPanel>
        <TabPanel key={3}>
          <AuditorsTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default UserFlow;
