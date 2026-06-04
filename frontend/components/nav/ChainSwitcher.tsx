import { useState } from "react";

import { ChevronDownIcon, ChevronUpIcon, WarningIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  Spacer,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useWallets } from "@privy-io/react-auth";
import Image from "next/image";

import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  chainNumberToChainHex,
  DENOTA_CHAINS,
  getChainConfigByHex,
} from "../../context/config/chains";
import { switchNetwork } from "../../context/SwitchNetwork";
import StyledMenuItem from "../designSystem/StyledMenuItem";

export default function ChainSwitcher() {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const { isInitializing, blockchainState, connectWallet } =
    useBlockchainData();
  const { account, chainId } = blockchainState;
  const { wallets } = useWallets();

  const selectedChain = getChainConfigByHex(chainId);

  const [isOpen, setIsOpen] = useState(false);

  const handleSelectChain = async (chainIdHex: string) => {
    setIsOpen(false);
    await switchNetwork(chainIdHex, wallets[0]);

    if (window.location.pathname === "/batch/") {
      connectWallet?.();
    }
  };
  if (account === "" || isInitializing) return <></>;
  return (
    <Menu isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <MenuButton
        as={Button}
        variant="ghost"
        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        size="sm"
        mr={2}
        aria-label="Select chain"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Flex alignItems="center">
          {selectedChain ? (
            <Image
              src={selectedChain.logoSrc}
              alt={selectedChain.displayName}
              width={20}
              height={20}
              unoptimized={true}
            />
          ) : (
            <Icon as={WarningIcon} boxSize={5} />
          )}
          <Spacer mx="1" />
          {isMobile ? null : (
            <Text fontSize="lg">
              {selectedChain ? selectedChain.displayName : "Unsupported Chain"}
            </Text>
          )}
        </Flex>
      </MenuButton>
      <MenuList bg="brand.100">
        {Object.values(DENOTA_CHAINS).map((chain) => {
          const chainIdHex = chainNumberToChainHex(chain.chain.id);
          return (
            <StyledMenuItem
              key={chainIdHex}
              onClick={() => handleSelectChain(chainIdHex)}
              isDisabled={chain.isDisabled}
            >
              <Flex alignItems="center">
                <Image
                  src={chain.logoSrc}
                  alt={chain.displayName}
                  width={20}
                  height={20}
                  unoptimized={true}
                />
                <Spacer mx="1" />
                {chain.displayName}
              </Flex>
            </StyledMenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
}
