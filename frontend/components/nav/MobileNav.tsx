import {
  Flex,
  FlexProps,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import ChainSwitcher from "./ChainSwitcher";
import WalletInfo from "./WalletInfo";

interface MobileProps extends FlexProps {
  onOpen: () => void;
}
export const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 24 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent="space-between"
      display={{ base: "flex", md: "none" }}
      {...rest}
    >
      <IconButton
        variant="outline"
        onClick={onOpen}
        aria-label="open menu"
        icon={<FiMenu />}
      />
      <Flex alignItems="center">
        <ChainSwitcher />
        <WalletInfo />
      </Flex>
    </Flex>
  );
};
