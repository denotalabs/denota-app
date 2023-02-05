import { ReactNode, useEffect, useRef } from "react";

import jazzicon from "jazzicon-ts";

import {
  Button,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import Web3Modal from "web3modal";
import { providerOptions } from "../../context/providerOptions";

const addToken = async (tokenAddress: string, symbol: string) => {
  try {
    const wasAdded = await (window as any).ethereum.request({
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

const NavLink = ({ children }: { children: ReactNode }) => (
  <Link
    px={2}
    py={1}
    rounded={"md"}
    _hover={{
      textDecoration: "none",
      bg: useColorModeValue("gray.200", "gray.700"),
    }}
    href={"#"}
  >
    {children}
  </Link>
);

export default function NavbarUser() {
  const { blockchainState } = useBlockchainData();

  const avatarRef = useRef<HTMLDivElement | null>(null);

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
        rounded={"full"}
        variant={"link"}
        cursor={"pointer"}
        minW={0}
      >
        <div ref={avatarRef}></div>
      </MenuButton>
      <MenuList alignItems={"center"}>
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
          onClick={async () => {
            const web3Modal = new Web3Modal({
              cacheProvider: true, // optional
              providerOptions, // required
            });
            web3Modal.clearCachedProvider();
            window.location.reload();
          }}
        >
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
