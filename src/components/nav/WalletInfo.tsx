import { useEffect, useRef } from "react";

import jazzicon from "jazzicon-ts";

import Web3Modal from "web3modal";

import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  useBreakpointValue,
  useColorMode,
} from "@chakra-ui/react";

import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { providerOptions } from "../../context/providerOptions";

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
  const isMobile = useBreakpointValue({ base: true, md: false });
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

  // TODO style menu - https://chakra-ui.com/docs/components/menu/theming
  return (
    <Menu>
      <MenuButton
        as={Button}
        rounded="full"
        variant="link"
        cursor="pointer"
        minW={0}
        alignItems="center"
        display="flex"
      >
        <div ref={avatarRef}></div>
      </MenuButton>
      <MenuList alignItems="center">
        <MenuItem closeOnSelect={false} justifyContent="space-between">
          Testnet Mode
          <Switch isChecked disabled={true} id="testnet-mode" />
        </MenuItem>
        {isMobile && (
          <MenuItem closeOnSelect={false} justifyContent="space-between">
            Dark Mode
            <Switch
              onChange={() => {
                toggleColorMode();
              }}
              isChecked={colorMode === "dark"}
              id="dark-mode"
            />
          </MenuItem>
        )}
        <MenuItem
          onClick={() => addToken(blockchainState.dai?.address ?? "", "DAI")}
        >
          Add DAI
        </MenuItem>
        <MenuItem
          onClick={() => addToken(blockchainState.weth?.address ?? "", "WETH")}
        >
          Add WETH
        </MenuItem>
        <MenuItem
          onClick={() => {
            logout(providerOptions);
          }}
        >
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
