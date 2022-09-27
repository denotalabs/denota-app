import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import CashTab from "../CashTab";
import WriteTab from "../WriteTab";
import AuditorsTab from "../AuditorsTab";

function UserFlow() {
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
          <WriteTab />
        </TabPanel>
        <TabPanel>
          <CashTab />
        </TabPanel>
        <TabPanel>
          <AuditorsTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default UserFlow;
