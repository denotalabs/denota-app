import { Flex } from "@chakra-ui/react";

import { useBlockchainData } from "../../context/BlockchainDataProvider";

import ChainSwitcher from "./ChainSwitcher";
import WalletInfo from "./WalletInfo";

const DesktopHeader = () => {
  const { blockchainState } = useBlockchainData();
  const { chainId } = blockchainState;

  return (
    <Flex
      px={8}
      py={4}
      as="nav"
      align="center"
      justify="flex-end"
      w="100%"
      gap={10}
    >
      <ChainSwitcher chainId={chainId} />
      <WalletInfo />
    </Flex>
  );
};

export default DesktopHeader;
