import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Button, Text, VStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  chainInfoForChainId,
  chainNumberToChainHex,
} from "../../context/chainInfo";
import { switchNetwork } from "../../context/SwitchNetwork";
import { CsvData } from "../../hooks/batch/useBatchPaymentReader";
import useDisperse from "../../hooks/batch/useDisperse";
import { useFormatAddress } from "../../hooks/useFormatAddress";
import DetailsRow from "../designSystem/DetailsRow";
import RoundedBox from "../designSystem/RoundedBox";
import RoundedButton from "../designSystem/RoundedButton";

interface Props {
  chainId: number;
  data: CsvData[];
}
function DisperseDetails({ chainId, data }: Props) {
  const { connectWallet } = useBlockchainData();

  const chainName = useMemo(() => {
    return chainInfoForChainId(chainId).displayName;
  }, [chainId]);

  const [isOpen, setIsOpen] = useState(false);

  const [isConfirmed, setIsConfirmed] = useState(false);

  const { disperseTokens, buttonTitle, isCorrectChain } = useDisperse({
    data,
    chainId,
  });

  const { formatAddress } = useFormatAddress();

  const tokenTotals = useMemo(() => {
    // Initialize an empty object to store token totals
    const totals: { [token: string]: number } = {};

    // Iterate over data and accumulate totals
    data.forEach(({ value, token }) => {
      if (totals[token]) {
        totals[token] += value;
      } else {
        totals[token] = value;
      }
    });

    // Convert totals object to an array of strings
    const tokenStrings = Object.entries(totals).map(
      ([token, value]) => `${value} ${token}`
    );

    // Construct final string with "and" before the last item
    if (tokenStrings.length > 1) {
      const last = tokenStrings.pop();
      return `${tokenStrings.join(", ")}, and ${last}`;
    }

    return tokenStrings[0] || "";
  }, [data]);

  const [isLoading, setIsLoading] = useState(false);

  return (
    <VStack w="100%" bg="brand.600" borderRadius="md" pt={6}>
      <RoundedBox mb={5} px={6}>
        <Text fontWeight={600} fontSize={"lg"} textAlign="center">
          You dispersing {tokenTotals} on {chainName}
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
            {data.map((row, index) => (
              <DetailsRow
                key={index}
                title={formatAddress(row.recipient)}
                value={`${row.value} ${row.token}`}
              />
            ))}
          </VStack>
        </RoundedBox>
      )}

      <RoundedButton
        mt={2}
        type="submit"
        isDisabled={isConfirmed}
        isLoading={isLoading}
        onClick={async () => {
          if (!isCorrectChain) {
            await switchNetwork(chainNumberToChainHex(chainId));
            // Force reload chain
            connectWallet?.();
          } else {
            setIsLoading(true);
            try {
              await disperseTokens();
              setIsConfirmed(true);
            } catch (error) {
              console.log(error);
            }
            setIsLoading(false);
          }
        }}
      >
        {buttonTitle}
      </RoundedButton>
    </VStack>
  );
}

export default DisperseDetails;
