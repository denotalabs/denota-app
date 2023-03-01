import { Flex } from "@chakra-ui/react";

import { useBlockchainData } from "../../context/BlockchainDataProvider";

import ChainSwitcher from "./ChainSwitcher";
import ToggleColor from "./ToggleColor";
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
      <ToggleColor />
    </Flex>
  );
};

export default DesktopHeader;
