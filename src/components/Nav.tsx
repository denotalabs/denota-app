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

interface Props {
  setIsUser: any; // Fix any
  isUser: boolean;
}

export default function Nav({ setIsUser, isUser }: Props) {
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Text as="b">CheqProtocol</Text>
          <Flex alignItems={"center"}>
            <Stack direction={"row"} spacing={7}>
              <NavbarUser />
              <SettingsCog setIsUser={setIsUser} isUser={isUser} />
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
