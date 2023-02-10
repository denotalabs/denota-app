import { Flex } from "@chakra-ui/react";
import Settings from "../fields/Settings";
import SwitchNetworkMenu from "./SwitchNetworkMenu";
import WalletInfo from "./WalletInfo";

interface Props {
  setIsUser: any;
  isUser: boolean;
}

const DesktopHeader = (props: Props) => {
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
      <WalletInfo />
      <Settings {...props} />
      <SwitchNetworkMenu/>
    </Flex>
  );
};

export default DesktopHeader;
