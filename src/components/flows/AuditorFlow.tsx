import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

// TODO - auditor flow: User handshake requests,
function AuditorFlow() {
  return (
    <Tabs>
      <TabList>
        <Tab>SomeTab</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>Some stuff</TabPanel>
      </TabPanels>
    </Tabs>
  );
}
export default AuditorFlow;
