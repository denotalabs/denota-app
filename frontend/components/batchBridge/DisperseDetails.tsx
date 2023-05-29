import { Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
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

  return (
    <VStack>
      <RoundedBox mb={5} padding={6}>
        <Text fontWeight={600} fontSize={"lg"} textAlign="center">
          You dispersing 5000 USDC and 1000 BOB on {chainName}
        </Text>
      </RoundedBox>

      <RoundedBox p={6}>
        <VStack>
          <DetailsRow title="0x123..456" value="10 USDC" />
          <DetailsRow title="0x123..456" value="10 USDC" />
        </VStack>
      </RoundedBox>

      <RoundedButton
        mt={2}
        type="submit"
        onClick={async () => {
          await switchNetwork(chainNumberToChainHex(chainId));
          // Force reload chain
          connectWallet?.();
        }}
      >
        {isCorrectChain ? "Confirm" : `Switch to ${chainName}`}
      </RoundedButton>
    </VStack>
  );
}

export default DisperseDetails;
