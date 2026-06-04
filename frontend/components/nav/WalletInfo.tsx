import { useCallback, useEffect, useRef, useState } from "react";

import { useClipboard } from "@chakra-ui/hooks";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  SmallCloseIcon
} from "@chakra-ui/icons";
import { useBreakpointValue } from "@chakra-ui/react";
import jazzicon from "jazzicon-ts";

import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  Spacer,
  Text,
} from "@chakra-ui/react";

import { usePrivy } from "@privy-io/react-auth";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import StyledMenuItem from "../designSystem/StyledMenuItem";

export default function WalletInfo() {
  const { isInitializing, connectWallet, blockchainState } =
    useBlockchainData();
  const { account } = blockchainState;
  const avatarRef = useRef<HTMLDivElement | null>(null);

  const { onCopy } = useClipboard(blockchainState.account);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const { logout } = usePrivy();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  useEffect(() => {
    const element = avatarRef.current;
    if (element && blockchainState.account) {
      const addr = blockchainState.account.slice(2, 10);
      const seed = parseInt(addr, 16);
      const icon = jazzicon(30, seed);
      if (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      element.appendChild(icon);
    }
  }, [blockchainState.account, avatarRef]);
  const [isOpen, setIsOpen] = useState(false);
  if (isInitializing) return <></>;
  if (account === "")
    return (
      <Button
        colorScheme="blue"
        onClick={() => {
          connectWallet?.();
        }}
      >
        Login/Sign Up
      </Button>
    );
  else
    return (
      <Menu isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <MenuButton
          as={Button}
          rounded="full"
          cursor="pointer"
          bg="brand.600"
          rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Flex alignItems="center" justifyContent="center">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              ref={avatarRef}
            ></div>
            <Spacer mx="1" />
            {isMobile ? null : (
              <>
                <Spacer mx="1" />
                <Text fontSize="lg">
                  {blockchainState.account &&
                    blockchainState.account.slice(0, 6) +
                    "..." +
                    blockchainState.account.slice(-4)}
                </Text>
              </>
            )}
          </Flex>
        </MenuButton>
        <MenuList alignItems="center" bg="brand.100">
          <StyledMenuItem
            onClick={onCopy}
            isDisabled={!blockchainState.account}
          >
            <CopyIcon mr={2} />
            Copy Address
          </StyledMenuItem>
          <StyledMenuItem onClick={handleLogout}>
            <SmallCloseIcon mr={2} />
            Logout
          </StyledMenuItem>
        </MenuList>
      </Menu>
    );
}
