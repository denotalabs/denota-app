import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import { BlockchainData } from "../../hooks/useBlockchainData";

import CashTab from "../CashTab";
import WriteTab from "../WriteTab";
import AuditorsTab from "../AuditorsTab";

interface Props {
  blockchainState: BlockchainData;
}

function UserFlow({ blockchainState }: Props) {
  return (
    <Tabs>
      <TabList>
        {/* <Tab>Deposit</Tab> */}
        <Tab>Write Cheq</Tab>
        <Tab>My Cheqs</Tab>
        <Tab>My Auditors</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <WriteTab blockchainState={blockchainState} />
        </TabPanel>
        <TabPanel>
          <CashTab blockchainState={blockchainState} />
        </TabPanel>
        <TabPanel>
          <AuditorsTab blockchainState={blockchainState} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default UserFlow;
