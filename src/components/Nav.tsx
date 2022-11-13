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
  isV2: boolean;
  setIsV2: any; // Fix any
}

export default function Nav(props: Props) {
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Text as="b">CRXProtocol</Text>
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
