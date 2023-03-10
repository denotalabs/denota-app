import { DownloadIcon } from "@chakra-ui/icons";
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
  const [file, setFile] = useState<string | undefined>(undefined);
  const [fileName, setFilename] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (cheq.uri) {
          const NOTE_URL = `https://gateway.lighthouse.storage/ipfs/${cheq.uri}`;
          const resp = await axios.get(NOTE_URL);
          setNote(resp.data.description);
          if (resp.data.file) {
            setFile(
              `https://gateway.lighthouse.storage/ipfs/${resp.data.file}`
            );
            setFilename(resp.data.filename);
          }
          setIsLoading(false);
        } else {
          setNote("");
        }
      } catch (error) {
        setNote("Error fetching note");
        console.log(error);
        setIsLoading(false);
      }
    }
    fetchData();
  }, [cheq.uri]);

  return (
    <VStack gap={4} mt={10} mb={6}>
      <RoundedBox px={6}>
        <VStack gap={0}>
          <DetailsRow
            title="Payer"
            value={cheq.formattedPayer}
            copyValue={!cheq.isPayer ? cheq.payer : undefined}
          />
          <DetailsRow
            title="Recipient"
            value={cheq.formattedPayee}
            copyValue={!cheq.isPayer ? undefined : cheq.payee}
          />
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
            tooltip="Funds are released immediately upon payment"
          />
        </VStack>
      </RoundedBox>
      {cheq.uri &&
        (!isLoading ? (
          <>
            {note && (
              <VStack gap={0} w="100%">
                <Text pl={6} fontWeight={600} w="100%" textAlign={"left"}>
                  Notes
                </Text>
                <RoundedBox p={4} mb={4}>
                  <Text fontWeight={300} textAlign={"left"}>
                    {note}
                  </Text>
                </RoundedBox>
              </VStack>
            )}
            {file && (
              <VStack gap={0} w="100%">
                <Text pl={6} fontWeight={600} w="100%" textAlign={"left"}>
                  File
                </Text>
                <RoundedBox p={4} mb={4}>
                  <a href={file} target="_blank" download>
                    {fileName}
                    <DownloadIcon ml={2} />
                  </a>
                </RoundedBox>
              </VStack>
            )}
          </>
        ) : (
          <Center>
            <Spinner size="md" />
          </Center>
        ))}
    </VStack>
  );
}

export default CheqDetails;
