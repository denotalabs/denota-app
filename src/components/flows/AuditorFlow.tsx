import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import UsersTab from "../UsersTab";
import VoidTab from "../VoidTab";

function AuditorFlow() {
  return (
    <Tabs>
      <TabList>
        <Tab>Auditing</Tab>
        <Tab>User Requests</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <VoidTab />
        </TabPanel>
        <TabPanel>
          <UsersTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default AuditorFlow;
