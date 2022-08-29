import { useEffect } from "react";

import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";

import useBlockchainData from "../hooks/useBlockchainData";

import CashTab from "../components/CashTab";
import AuditorsTab from "../components/AuditorsTab";
import Nav from "../components/Nav";
import DepositTab from "../components/DepositTab";
import WriteTab from "../components/WriteTab";
import NewAuditorsTab from "../components/NewAuditorsTab";

function HomePage() {
  const { blockchainState, loadBlockchainData } = useBlockchainData();

  useEffect(() => {
    loadBlockchainData();
  }, [loadBlockchainData]);
  return (
    <>
      <Nav blockchainState={blockchainState} />

      <br></br>
      <h1>Welcome to Cheq</h1>
      <h6>Total cheqs written: {blockchainState.cheqBalance}</h6>
      <h6>Total weth deposited: {blockchainState.wethBalance}</h6>
      <h6>Total dai deposited: {blockchainState.daiBalance}</h6>
      <br></br>
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
    </>
  );
}

export default HomePage;
