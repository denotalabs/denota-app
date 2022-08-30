import {
  Box,
  Flex,
  Button,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

import NavbarUser from "./NavbarUser";
import type { BlockchainData } from "../hooks/useBlockchainData";

interface Props {
  blockchainState: BlockchainData;
}

export default function Nav({ blockchainState }: Props) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Box>Cheq</Box>
          <h6>{blockchainState.account}</h6>
          <h6>
            qWETH Balance: {blockchainState.qDAI}
            <br></br>
            qDAI Balance: {blockchainState.qWETH}
          </h6>
          <Flex alignItems={"center"}>
            <Stack direction={"row"} spacing={7}>
              <NavbarUser />
              <Button onClick={toggleColorMode}>
                {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              </Button>
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
