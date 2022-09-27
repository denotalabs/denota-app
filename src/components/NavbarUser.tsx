import { ReactNode } from "react";

import {
  Avatar,
  Button,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Center,
  useColorModeValue,
} from "@chakra-ui/react";
import { DaiAddress, WethAddress } from "../hooks/useBlockchainData";
import type { BlockchainData } from "../hooks/useBlockchainData";
interface Props {
  blockchainState: BlockchainData;
}

let addToken = async (tokenAddress: string, symbol: string) => {
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
    if (wasAdded) {
      console.log("Added");
    } else {
      console.log("Not added");
    }
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

export default function NavbarUser({ blockchainState }: Props) {
  let imageURL =
    blockchainState.userType == "Auditor"
      ? "https://cdn-icons-png.flaticon.com/512/2352/2352184.png"
      : blockchainState.userType == "Merchant"
      ? "https://img.favpng.com/3/8/14/computer-icons-merchant-clip-art-portable-network-graphics-vector-graphics-png-favpng-GVS1Me5FzY2iJ9HwQPFgNwhdH.jpg"
      : "https://mpng.subpng.com/20190419/cus/kisspng-computer-icons-single-customer-view-vector-graphic-faberlic-5cba3294f07246.5572284215557065169849.jpg";
  return (
    <Menu>
      <MenuButton
        as={Button}
        rounded={"full"}
        variant={"link"}
        cursor={"pointer"}
        minW={0}
      >
        <Avatar size={"sm"} src={imageURL} />
      </MenuButton>
      <MenuList alignItems={"center"}>
        <br />
        <Center>
          <Avatar size={"2xl"} src={imageURL} />
        </Center>
        <br />
        <Center>
          <p>{blockchainState.userType}</p>
        </Center>
        <MenuDivider />
        <MenuItem onClick={() => addToken(DaiAddress, "DAI")}>Add DAI</MenuItem>
        <MenuItem onClick={() => addToken(WethAddress, "WETH")}>
          Add WETH
        </MenuItem>
        <MenuItem onClick={() => console.log()}>
          {" "}
          {/* setIsUser(false)*/}
          Auditor Mode
        </MenuItem>
        <MenuItem>Logout</MenuItem>
      </MenuList>
    </Menu>
  );
}
