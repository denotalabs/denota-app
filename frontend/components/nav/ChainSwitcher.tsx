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
import Image from "next/image";

import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { deployedChains } from "../../context/chainInfo";
import { switchNetwork } from "../../context/SwitchNetwork";
import useDemoMode from "../../hooks/useDemoMode";
import StyledMenuItem from "../designSystem/StyledMenuItem";

export default function ChainSwitcher() {
  const isDemoMode = useDemoMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const { isInitializing, blockchainState } = useBlockchainData();
  const { account, chainId } = blockchainState;

  const selectedChain = deployedChains[chainId];

  const [isOpen, setIsOpen] = useState(false);

  const { connectWallet } = useBlockchainData();

  const handleSelectChain = async (chain: {
    displayName: string;
    chainId: string;
    logoSrc: string;
    isDisabled?: boolean;
  }) => {
    setIsOpen(false);
    await switchNetwork(chain.chainId);

    // Batch screen doesn't reload the page so force blockchain data refresh here
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
        {Object.values(deployedChains).map((chain) => (
          <StyledMenuItem
            key={chain.chainId}
            onClick={() => handleSelectChain(chain)}
            isDisabled={!isDemoMode && chain.isDisabled}
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
        ))}
      </MenuList>
    </Menu>
  );
}
