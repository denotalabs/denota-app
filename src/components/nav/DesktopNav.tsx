import { Box, Flex } from "@chakra-ui/react";

import ChainSwitcher from "./ChainSwitcher";
import WalletInfo from "./WalletInfo";

const DesktopNav = () => {
  return (
    <Box ml={{ base: 0, md: 60 }} display={{ base: "none", md: "block" }}>
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
    </Box>
  );
};

export default DesktopNav;
