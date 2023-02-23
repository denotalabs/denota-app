import { Center, Spinner, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { Cheq } from "../../../hooks/useCheqs";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  cheq: Cheq;
}

function CheqDetails({ cheq }: Props) {
  const { blockchainState } = useBlockchainData();

  const [note, setNote] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      try {
        const NOTE_URL = `https://cheq-nft.s3-us-west-2.amazonaws.com/${cheq.uri}`;
        const resp = await axios.get(NOTE_URL);
        setNote(resp.data.description);
      } catch (error) {
        setNote("Error fetching note");
        console.log(error);
      }
    }
    fetchData();
  }, [cheq.uri]);

  return (
    <VStack gap={4} mt={10} mb={6}>
      <RoundedBox px={6}>
        <VStack gap={0}>
          <DetailsRow title="Payer" value={cheq.formattedPayer} />
          <DetailsRow title="Recipient" value={cheq.formattedPayee} />
          <DetailsRow
            title="Created On"
            value={cheq.createdTransaction.date.toDateString()}
            link={`${blockchainState.explorer}${cheq.createdTransaction.hash}`}
          />
          {cheq.fundedTransaction && (
            <DetailsRow
              title="Funded Date"
              value={cheq.fundedTransaction.date.toDateString()}
              link={`${blockchainState.explorer}${cheq.fundedTransaction.hash}`}
            />
          )}
          <DetailsRow
            title="Payment Amount"
            value={String(cheq.amount) + " " + cheq.token}
          />
          <DetailsRow
            title="Module"
            value="Direct Pay"
            tooltip="Funds are released immeidately upon payment"
          />
        </VStack>
      </RoundedBox>
      <RoundedBox p={4} mb={4}>
        {note !== undefined ? (
          <Text fontWeight={600} textAlign={"center"}>
            {note}
          </Text>
        ) : (
          <Center>
            <Spinner size="md" />
          </Center>
        )}
      </RoundedBox>
    </VStack>
  );
}

export default CheqDetails;
