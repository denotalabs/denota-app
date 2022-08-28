import { useEffect } from "react";

import { Tabs, Tab } from "react-bootstrap";

import useBlockchainData from "./hooks/useBlockchainData";

import "./App.css";

import Navbar from "./Navbar";
import DepositTab from "./DepositTab";
import WriteTab from "./WriteTab";
import CashTab from "./CashTab";
import AuditorsTab from "./AuditorsTab";

function App() {
  const { blockchainState, loadBlockchainData } = useBlockchainData();

  useEffect(() => {
    loadBlockchainData();
  }, [loadBlockchainData]);

  return (
    <div>
      <Navbar blockchainState={blockchainState} />

      <div className="container-fluid mt-5 text-center">
        
        <br></br>
        <h1>Welcome to Cheq</h1>
        <h6>Total cheqs written: {blockchainState.cheqBalance}</h6>
        <h6>Total weth deposited: {blockchainState.wethBalance}</h6>
        <h6>Total dai deposited: {blockchainState.daiBalance}</h6>
        <br></br>
        
            <div className="tabs">
              <Tabs id="uncontrolled-tab-example">
                <Tab eventKey="deposit" title="Deposit">
                  <DepositTab blockchainState={blockchainState} />
                </Tab>
                <Tab eventKey="write" title="Write">
                  <WriteTab blockchainState={blockchainState} />
                </Tab>
                <Tab eventKey="cash" title="Cash">
                  <CashTab blockchainState={blockchainState} />
                </Tab>
                <Tab eventKey="Auditors" title="Auditors">
                  <AuditorsTab blockchainState={blockchainState} />
                </Tab>
              </Tabs>
            </div>
      </div>
    </div>
  );
}

export default App;
