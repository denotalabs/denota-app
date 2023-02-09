import { Flex } from "@chakra-ui/react";
import SettingsCog from "../fields/SettingsCog";
import NavbarUser from "./NavbarUser";

interface Props {
  setIsUser: any;
  isUser: boolean;
}

const ResponsiveNav = (props: Props) => {
  return (
    <Flex
      px={8}
      py={4}
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      w="100%"
      gap={6}
    >
      <NavbarUser />
      <SettingsCog {...props} />
    </Flex>
  );
};

export default ResponsiveNav;
