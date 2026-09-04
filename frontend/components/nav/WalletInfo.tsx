import { useCallback, useEffect, useRef } from "react";

import { useClipboard } from "@chakra-ui/hooks";
import {
  ChevronDownIcon,
  CopyIcon,
  SmallCloseIcon,
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
import { LOGIN_SIGN_UP_LABEL } from "../../utils/authLabels";
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
  }, [blockchainState.account]);

  if (isInitializing) return <></>;
  if (account === "")
    return (
      <Button
        bg="brand.200"
        color="brand.100"
        _hover={{ bg: "black" }}
        onClick={() => {
          connectWallet?.();
        }}
      >
        {LOGIN_SIGN_UP_LABEL}
      </Button>
    );

  return (
    <Menu>
      <MenuButton
        as={Button}
        rounded="full"
        cursor="pointer"
        bg="brand.600"
        border="1px solid"
        borderColor="gray.200"
        rightIcon={<ChevronDownIcon />}
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
          {!isMobile && (
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
      <MenuList alignItems="center" bg="brand.100" zIndex={1500}>
        <StyledMenuItem
          onClick={onCopy}
          isDisabled={!blockchainState.account}
        >
          <CopyIcon mr={2} />
          Copy Address
        </StyledMenuItem>
        <StyledMenuItem
          onClick={(e) => {
            e.stopPropagation();
            void handleLogout();
          }}
        >
          <SmallCloseIcon mr={2} />
          Logout
        </StyledMenuItem>
      </MenuList>
    </Menu>
  );
}
