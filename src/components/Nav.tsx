import {
  Box,
  Flex,
  Button,
  useDisclosure,
  useColorModeValue,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";

import NavbarUser from "./NavbarUser";
import SettingsCog from "./SettingsCog";

export default function Nav() {
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Text as="b">CheqProtocol</Text>
          {/* <Text minWidth={50} fontSize="xs">
            {blockchainState.account}
          </Text>
          <Text fontSize="xs">qWETH Balance: {blockchainState.qDAI}</Text>
          <Text fontSize="xs">qDAI Balance: {blockchainState.qWETH}</Text> */}

          <Flex alignItems={"center"}>
            <Stack direction={"row"} spacing={7}>
              <NavbarUser />
              <SettingsCog />
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
