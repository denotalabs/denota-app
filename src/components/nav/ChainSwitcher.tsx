import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
} from "@chakra-ui/react";
import Image from "next/image";
import { useState } from "react";
import { FaCaretDown } from "react-icons/fa";
import { switchNetwork } from "../../context/SwitchNetwork";

interface ChainSwitcherProps {
  chains: { name: string; chainId: string; logoSrc: string; isDisabled?: boolean }[];
}

export default function ChainSwitcher({ chains }: ChainSwitcherProps) {
  const [selectedChain, setSelectedChain] = useState(chains[0]);

  const handleSelectChain = async (chain: {
    name: string;
    chainId: string;
    logoSrc: string;
  }) => {
    setSelectedChain(chain);
    await switchNetwork(chain.chainId);
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        rightIcon={<FaCaretDown />}
        size="sm"
        mr={2}
        aria-label="Select chain"
      >
        <Flex alignItems="center">
          <Image
            src={selectedChain.logoSrc}
            alt={selectedChain.name}
            width={20}
            height={20}
          />
          <Spacer mx="1" />
          <span>{selectedChain.name}</span>
        </Flex>
      </MenuButton>
      <MenuList minWidth="unset" maxWidth="unset">
        {chains.map((chain) => (
          <MenuItem
            key={chain.chainId}
            onClick={() => handleSelectChain(chain)}
            isDisabled={chain.isDisabled}
          >
            <Flex alignItems="center">
              <Image
                src={chain.logoSrc}
                alt={chain.name}
                width={20}
                height={20}
              />
              <Spacer mx="1" />
              <span>{chain.name}</span>
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
