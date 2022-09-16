import React, { useContext } from "react";
import { Contract, Account, Header } from "../components";
import { Web3Consumer } from "../helpers/Web3Context";

function Home({ web3 }) {

  return (
    <>
      {/* Page Header start */}
      <div className="flex flex-1 justify-between items-center" style={{border: '1px solid rgba(0, 0, 0, 0.05)'}}>
        <Header />
        <div className="mr-6">
          <Account {...web3} />
        </div>
      </div>
      {/* Page Header end */}

      {/* Main Page Content start */}
      <div className="flex flex-1 flex-col h-screen w-full items-center">
        <div className="text-center">
          <Contract
            name="Cheq"
            signer={web3.userSigner}
            provider={web3.localProvider}
            address={web3.address}
            blockExplorer={web3.blockExplorer}
            contractConfig={web3.contractConfig}
          />
        </div>
      </div>
    </>
  );
}

export default Web3Consumer(Home);
