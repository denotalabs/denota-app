import { useState } from "react";
import { Flex, Box, Text, ButtonGroup, Button, Stack } from "@chakra-ui/react";
import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import Link from "next/link";
import NavbarUser from "./NavbarUser";
import SettingsCog from "../legacy/SettingsCog";

interface Props {
  setIsUser: any;
  isUser: boolean;
}

const ResponsiveNav = (props: Props) => {
  const [show, setShow] = useState(false);
  const toggleMenu = () => setShow(!show);
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
      <Box>
        <Text fontSize="lg" fontWeight="bold">
          CruxProtocol
        </Text>
      </Box>

      <Box display={{ base: "block", md: "none" }} onClick={toggleMenu}>
        {show ? <CloseIcon /> : <HamburgerIcon />}
      </Box>

      <Box
        display={{ base: show ? "block" : "none", md: "block" }}
        flexBasis={{ base: "100%", md: "auto" }}
        flexGrow={1}
      >
        <Flex
          align="center"
          justify={[
            "center",
            "space-between",
            "space-between",
            "space-between",
          ]}
          direction={["column", "row", "row", "row"]}
          pt={[4, 4, 0, 0]}
        >
          <ButtonGroup variant="link" spacing="6">
            <Link href="/" passHref>
              <Button as="a" key="dashboard">
                Dashboard
              </Button>
            </Link>
            <Link href="/learn" passHref>
              <Button as="a" key="docs">
                Docs
              </Button>
            </Link>
            <Link href="/about" passHref>
              <Button as="a" key="about">
                About
              </Button>
            </Link>
          </ButtonGroup>
          <Flex alignItems={"center"} display={{ base: "none", md: "block" }}>
            <Stack direction={"row"} spacing={7}>
              <NavbarUser />
              <SettingsCog {...props} />
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
};

export default ResponsiveNav;
