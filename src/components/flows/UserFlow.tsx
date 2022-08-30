import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import { BlockchainData } from "../../hooks/useBlockchainData";

import CashTab from "../CashTab";
import AuditorsTab from "../AuditorsTab";
import DepositTab from "../DepositTab";
import WriteTab from "../WriteTab";
import NewAuditorsTab from "../NewAuditorsTab";

interface Props {
  blockchainState: BlockchainData;
}

function UserFlow({ blockchainState }: Props) {
  return (
    <Tabs>
      <TabList>
        <Tab>Deposit</Tab>
        <Tab>Write</Tab>
        <Tab>Cash</Tab>
        <Tab>Auditors</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <DepositTab blockchainState={blockchainState} />
        </TabPanel>
        <TabPanel>
          <WriteTab blockchainState={blockchainState} />
        </TabPanel>
        <TabPanel>
          {/* TODO add chakra UI cash tab */}
          <CashTab blockchainState={blockchainState} />
        </TabPanel>
        <TabPanel>
          <NewAuditorsTab blockchainState={blockchainState} />
          <AuditorsTab blockchainState={blockchainState} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default UserFlow;
