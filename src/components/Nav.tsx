import {
  Box,
  Flex,
  Button,
  useDisclosure,
  useColorModeValue,
  Stack,
  Text,
  useColorMode,
  ButtonGroup,
} from "@chakra-ui/react";
import Link from "next/link";

import NavbarUser from "./NavbarUser";
import SettingsCog from "./SettingsCog";

interface Props {
  setIsUser: any; // Fix any
  isUser: boolean;
  isV2: boolean;
  setIsV2: any; // Fix any
}

export default function Nav(props: Props) {
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Stack direction={"row"} spacing={6}>
            <Text as="b">CRXProtocol</Text>
            <ButtonGroup variant="link" spacing="6">
              <Link href="/" passHref>
                <Button key="dashboard">Dashboard</Button>
              </Link>
              <Link href="/learn" passHref>
                <Button key="docs">Docs</Button>
              </Link>
              <Link href="/about" passHref>
                <Button key="about">About</Button>
              </Link>
            </ButtonGroup>
          </Stack>
          <Flex alignItems={"center"}>
            <Stack direction={"row"} spacing={7}>
              <NavbarUser />
              <SettingsCog {...props} />
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
