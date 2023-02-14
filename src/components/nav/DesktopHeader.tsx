import { Flex } from "@chakra-ui/react";
import ToggleColor from "./ToggleColor";
import WalletInfo from "./WalletInfo";

const DesktopHeader = () => {
  return (
    <Flex
      px={8}
      pt={4}
      as="nav"
      align="center"
      justify="flex-end"
      w="100%"
      gap={10}
    >
      <WalletInfo />
      <ToggleColor />
      {/* <SwitchNetworkMenu /> */}
    </Flex>
  );
};

export default DesktopHeader;
