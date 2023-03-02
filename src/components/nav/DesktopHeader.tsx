import { Flex } from "@chakra-ui/react";

import ChainSwitcher from "./ChainSwitcher";
import WalletInfo from "./WalletInfo";

const DesktopHeader = () => {
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
      <ChainSwitcher />
      <WalletInfo />
    </Flex>
  );
};

export default DesktopHeader;
