import { useState } from "react";
import { ethers } from "ethers";

import type { BlockchainData } from "./hooks/useBlockchainData";

interface Props {
  blockchainState: BlockchainData;
}

function DepositTab({ blockchainState }: Props) {
  const [depositAmount, setDepositAmount] = useState("");
  const [depositToken, setDepositToken] = useState("dai");

  return (
    <div>
      <br></br>
      How much do you want to deposit?
      <br></br>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const weiAmount = ethers.utils.parseEther(depositAmount.toString()); // convert to wei
          if (
            blockchainState.cheq !== null &&
            blockchainState.dai !== null &&
            blockchainState.weth !== null
          ) {
            const token =
              depositToken == "dai"
                ? blockchainState.dai
                : blockchainState.weth;
            token.approve(blockchainState.cheq.address, weiAmount);
            blockchainState.cheq?.functions['deposit(address,uint256)'](token, weiAmount);
          }
        }}
      >
        <div className="form-group mr-sm-2">
          <br></br>
          <select
            id="token"
            className="form-control form-control-md"
            placeholder="dai"
            defaultValue={"dai"}
            onChange={(e) => {
              setDepositToken(e.target.value);
            }}
          >
            <option value="dai">DAI</option>
            <option value="weth">WETH</option>
          </select>
          <br></br>
          <input
            id="depositAmount"
            step="0.01"
            type="number"
            className="form-control form-control-md"
            placeholder="Amount..."
            required
            onChange={(e) => {
              setDepositAmount(e.target.value);
            }}
          />
        </div>
        <br></br>
        <button type="submit" className="btn btn-primary">
          Deposit
        </button>
      </form>
    </div>
  );
}

export default DepositTab;
