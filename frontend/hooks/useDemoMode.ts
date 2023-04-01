import { useBlockchainData } from "../context/BlockchainDataProvider";

const useDemoMode = () => {
  const { blockchainState } = useBlockchainData();
  const { account } = blockchainState;

  const isDemoWallet = (walletAddress: string): boolean => {
    const demoWallets = [
      "0x167813E0D6958BCF30a1cEbEE53aE0C57677c963", // Alex
      "",
      "0x374E4F9EF906F3e51df1b3305936Ec18A6797748", // Rafi
      "0x1d2CBA07B5EFE517586F0453303B5CAFa904e5ca",
      "", // MB
      ""
    ]; 
    return demoWallets.includes(walletAddress);
  };

  const isDemoMode = isDemoWallet(account);
  return isDemoMode;
};

export default useDemoMode;
