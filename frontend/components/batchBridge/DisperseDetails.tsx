import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Button, Text, VStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  chainInfoForChainId,
  chainNumberToChainHex,
} from "../../context/chainInfo";
import { switchNetwork } from "../../context/SwitchNetwork";
import DetailsRow from "../designSystem/DetailsRow";
import RoundedBox from "../designSystem/RoundedBox";
import RoundedButton from "../designSystem/RoundedButton";

interface Props {
  chainId: number;
}
function DisperseDetails({ chainId }: Props) {
  const { blockchainState, connectWallet } = useBlockchainData();

  const isCorrectChain = useMemo(() => {
    return blockchainState.chainId === chainNumberToChainHex(chainId);
  }, [blockchainState.chainId, chainId]);

  const chainName = useMemo(() => {
    return chainInfoForChainId(chainId).displayName;
  }, [chainId]);

  const [isOpen, setIsOpen] = useState(false);

  const [isConfirmed, setIsConfirmed] = useState(false);

  const buttonTitle = useMemo(() => {
    if (isConfirmed) {
      return "Confirmed";
    }
    if (!isCorrectChain) {
      return;
    }
    return isCorrectChain ? "Confirm" : `Switch to ${chainName}`;
  }, [chainName, isConfirmed, isCorrectChain]);

  return (
    <VStack w="100%" bg="brand.600" borderRadius="md" pt={6}>
      <RoundedBox mb={5} px={6}>
        <Text fontWeight={600} fontSize={"lg"} textAlign="center">
          You dispersing 5000 USDC and 1000 BOB on {chainName}
        </Text>
      </RoundedBox>
      <Button
        mt={4}
        leftIcon={isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
        onClick={() => setIsOpen(!isOpen)}
        bg="transparent"
        sx={{
          "&:hover": {
            bg: "transparent",
          },
        }}
      >
        Recipients
      </Button>

      {isOpen && (
        <RoundedBox px={6}>
          <VStack>
            <DetailsRow title="0x123..456" value="10 USDC" />
            <DetailsRow title="0x123..456" value="10 USDC" />
          </VStack>
        </RoundedBox>
      )}

      <RoundedButton
        mt={2}
        type="submit"
        isDisabled={isConfirmed}
        onClick={async () => {
          if (!isCorrectChain) {
            await switchNetwork(chainNumberToChainHex(chainId));
            // Force reload chain
            connectWallet?.();
          } else {
            setIsConfirmed(true);
          }
        }}
      >
        {buttonTitle}
      </RoundedButton>
    </VStack>
  );
}

export default DisperseDetails;
