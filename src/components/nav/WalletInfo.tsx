import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import jazzicon from "jazzicon-ts";
import Web3Modal from "web3modal";

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

import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { providerOptions } from "../../context/providerOptions";
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

const logout = (providerOptions: any) => {
  const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
  });
  web3Modal.clearCachedProvider();
  window.location.reload();
};

export default function WalletInfo() {
  const { blockchainState } = useBlockchainData();
  const avatarRef = useRef<HTMLDivElement | null>(null);
  const { colorMode, toggleColorMode } = useColorMode();

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

  // TODO style menu - https://chakra-ui.com/docs/components/menu/theming
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
          <div ref={avatarRef}></div>
          <Spacer mx="1" />
          <Text fontSize="lg">
            {blockchainState.account &&
              blockchainState.account.slice(0, 6) +
                "..." +
                blockchainState.account.slice(-4)}
          </Text>
        </Flex>
      </MenuButton>
      <MenuList alignItems="center" bg="brand.100">
        <StyledMenuItem closeOnSelect={false} justifyContent="space-between">
          Testnet Mode
          <Switch isChecked disabled={true} id="testnet-mode" />
        </StyledMenuItem>
        <StyledMenuItem closeOnSelect={false} justifyContent="space-between">
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
          Add DAI
        </StyledMenuItem>
        <StyledMenuItem
          onClick={() => addToken(blockchainState.weth?.address ?? "", "WETH")}
        >
          Add WETH
        </StyledMenuItem>
        <StyledMenuItem
          onClick={() => {
            logout(providerOptions);
          }}
        >
          Logout
        </StyledMenuItem>
      </MenuList>
    </Menu>
  );
}
