import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import UsersTab from "../UsersTab";

function AuditorFlow() {
  return (
    <Tabs>
      <TabList>
        <Tab>Cheqs</Tab>
        <Tab>User Requests</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>Accept or deny</TabPanel>
        <TabPanel>
          <UsersTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default AuditorFlow;
