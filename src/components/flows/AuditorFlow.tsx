import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import { BlockchainData } from "../../hooks/useBlockchainData";

interface Props {
  blockchainState: BlockchainData;
}

// TODO - auditor flow: User handshake requests, 
function AuditorFlow({ blockchainState }: Props) {
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
