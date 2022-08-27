import { useState } from "react";
import { ethers } from "ethers";
import type { BlockchainData } from "./hooks/useBlockchainData";

interface Props {
  blockchainState: BlockchainData;
}

function WriteTab({ blockchainState }: Props) {
  const [depositToken, setDepositToken] = useState("dai");
  const [writeToken, setWriteToken] = useState("dai");

  // User Writing Cheque
  const [amount, setAmount] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [bearer, setBearer] = useState("");
  const [duration, setDuration] = useState("");

  return (
    <div>
      <br></br>
      <form
        className="form-group mr-sm-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            blockchainState.cheq !== null &&
            blockchainState.dai !== null &&
            blockchainState.weth !== null
          ) {
            const token =
              depositToken == "dai"
                ? blockchainState.dai
                : blockchainState.weth;
            // console.log(amount, duration, reviewer, bearer)
            const amountWei = ethers.utils.parseEther(amount).toString();
            console.log(amountWei, typeof amountWei);
            blockchainState.cheq?.functions[
              "writeCheque(address,uint256,uint256,address,address)"
            ](
              token,
              amountWei,
              duration,
              reviewer.toString(),
              bearer.toString()
            );
          }
        }}
      >
        <div>
          <br></br>
          <input
            id="bearer"
            type="text"
            className="form-control form-control-md"
            placeholder="Recieving Account..."
            required
            onChange={(e) => {
              setBearer(e.target.value);
            }}
          />
        </div>
        <div>
          <br></br>
          <input
            id="reviewer"
            type="text"
            className="form-control form-control-md"
            placeholder="Reviewing Account..."
            required
            onChange={(e) => {
              setReviewer(e.target.value);
            }}
          />
        </div>
        <div>
          <br></br>
          <input
            id="duration"
            type="number"
            step="1"
            className="form-control form-control-md"
            placeholder="To Expire In _ Seconds"
            required
            onChange={(e) => {
              setDuration(e.target.value);
            }}
          />
        </div>
        <div>
          <br></br>
          <select
            id="token"
            className="form-control form-control-md"
            placeholder="dai"
            defaultValue={"dai"}
            onChange={(e) => {
              setWriteToken(e.target.value);
            }}
          >
            <option value="dai">DAI</option>
            <option value="weth">WETH</option>
          </select>
          <br></br>
          <input
            id="amount"
            type="number"
            step="0.01"
            className="form-control form-control-md"
            placeholder="Amount..."
            required
            onChange={(e) => {
              setAmount(e.target.value);
            }}
          />
        </div>
        <div className="form-group mt-5">
          <button type="submit" className="btn btn-primary">
            Send Cheque
          </button>
        </div>
      </form>
    </div>
  );
}

export default WriteTab;
