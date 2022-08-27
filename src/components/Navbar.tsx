import type { BlockchainData } from "./hooks/useBlockchainData";
import cheqImage from "../cheq.png";

interface Props {
  blockchainState: BlockchainData;
}

function Navbar({ blockchainState }: Props) {
  return (
    <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
      <a
        className="navbar-brand col-sm-3 col-md-2 mr-0"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={cheqImage} className="App-logo" alt="logo" height="32" />
        <b> Cheq</b>
      </a>
      <h6 style={{ color: "rgb(255, 255, 255)" }}>{blockchainState.account}</h6>
      <h6 style={{ color: "rgb(255, 255, 255)", marginRight: "20px" }}>
        qWETH Balance: {blockchainState.qDAI}
        <br></br>
        qDAI Balance: {blockchainState.qWETH}
      </h6>
    </nav>
  );
}

export default Navbar;
