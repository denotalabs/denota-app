import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Button, Link, Text, VStack } from "@chakra-ui/react";

import {
  blockExplorerAddressUrl,
  DEFAULT_CHAIN_ID,
  getChainConfig,
} from "../../../context/config/chains";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import SimpleModal from "../../designSystem/SimpleModal";
import { NFT_COLLECTION_SPOOFING_NOTICE } from "../../../utils/balanceOfConditionalCash";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  contractName: string | null;
}

function NftCollectionVerifiedModal({
  isOpen,
  onClose,
  address,
  contractName,
}: Props) {
  const { blockchainState } = useBlockchainData();
  const chainId = blockchainState.chainIdNumber || DEFAULT_CHAIN_ID;
  const chainName = getChainConfig(chainId)?.displayName ?? "Block explorer";
  const explorerUrl = blockExplorerAddressUrl(
    blockchainState.explorer,
    address
  );

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose}>
      <VStack align="stretch" spacing={4} py={2} px={1}>
        <Text fontSize="sm" color="orange.200">
          {NFT_COLLECTION_SPOOFING_NOTICE}
        </Text>
        {contractName ? (
          <Text fontSize="md" color="whiteAlpha.900">
            Name: {contractName}
          </Text>
        ) : null}
        <Text
          fontSize="sm"
          fontFamily="mono"
          wordBreak="break-all"
          color="whiteAlpha.700"
        >
          {address}
        </Text>
        <Link href={explorerUrl} isExternal fontSize="sm" color="teal.300">
          View contract on {chainName}
          <ExternalLinkIcon mx="2px" />
        </Link>
        <Button alignSelf="flex-end" onClick={onClose}>
          Got it
        </Button>
      </VStack>
    </SimpleModal>
  );
}

export default NftCollectionVerifiedModal;
