import { useCallback, useEffect, useRef, useState } from "react";

import { useClipboard } from "@chakra-ui/hooks";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  InfoIcon,
  MoonIcon,
  SmallAddIcon,
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
  Switch,
  Text,
  useColorMode,
} from "@chakra-ui/react";

import { useConnectWallet } from "@web3-onboard/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import StyledMenuItem from "../designSystem/StyledMenuItem";

const addToken = async (tokenAddress: string, symbol: string) => {
  try {
    await (window as any).ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: tokenAddress,
          symbol: symbol,
          decimals: 18,
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export default function WalletInfo() {
  const { isInitializing, connectWallet, blockchainState } =
    useBlockchainData();
  const { account } = blockchainState;
  const avatarRef = useRef<HTMLDivElement | null>(null);

  const { colorMode, toggleColorMode } = useColorMode();
  const { onCopy } = useClipboard(blockchainState.account);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const [{ wallet }, , disconnect] = useConnectWallet();

  const logout = useCallback(async () => {
    await disconnect(wallet);
    window.location.reload();
  }, [disconnect, wallet]);

  useEffect(() => {
    const element = avatarRef.current;
    if (element && blockchainState.account) {
      const addr = blockchainState.account.slice(2, 10);
      const seed = parseInt(addr, 16);
      const icon = jazzicon(30, seed); //generates a size 20 icon
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
        Connect Wallet
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
          <StyledMenuItem closeOnSelect={false} justifyContent="space-between">
            <InfoIcon mr={2} />
            Testnet Mode
            <Switch isChecked disabled={true} id="testnet-mode" />
          </StyledMenuItem>
          <StyledMenuItem closeOnSelect={false} justifyContent="space-between">
            <MoonIcon mr={2} />
            Dark Mode
            <Switch
              onChange={() => {
                toggleColorMode();
              }}
              isChecked={colorMode === "dark"}
              id="dark-mode"
              disabled={true}
            />
          </StyledMenuItem>

          <StyledMenuItem
            onClick={() => addToken(blockchainState.dai?.address ?? "", "DAI")}
          >
            <SmallAddIcon mr={2} />
            Add DAI
          </StyledMenuItem>
          <StyledMenuItem
            onClick={() =>
              addToken(blockchainState.weth?.address ?? "", "WETH")
            }
          >
            <SmallAddIcon mr={2} />
            Add WETH
          </StyledMenuItem>

          <StyledMenuItem
            onClick={onCopy}
            isDisabled={!blockchainState.account}
          >
            <CopyIcon mr={2} />
            Copy Address
          </StyledMenuItem>
          <StyledMenuItem
            onClick={() => {
              logout();
            }}
          >
            <SmallCloseIcon mr={2} />
            Logout
          </StyledMenuItem>
        </MenuList>
      </Menu>
    );
}
