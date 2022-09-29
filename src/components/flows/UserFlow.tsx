import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import CashTab from "../CashTab";
import WriteTab from "../WriteTab";
import AuditorsTab from "../AuditorsTab";

function UserFlow() {
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
          <CashTab />
        </TabPanel>
        <TabPanel key={3}>
          <AuditorsTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default UserFlow;
