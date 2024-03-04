import { DownloadIcon } from "@chakra-ui/icons";
import { Center, HStack, Spinner, Tag, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useFormatAddress } from "../../../hooks/useFormatAddress";
import { Nota } from "../../../hooks/useNotas";
import { useTokens } from "../../../hooks/useTokens";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  nota: Nota;
}

function NotaDetails({ nota }: Props) {
  const { blockchainState } = useBlockchainData();
  const { explorer } = blockchainState;
  const [note, setNote] = useState<string | undefined>(undefined);
  const [file, setFile] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[] | undefined>(undefined);

  const [fileName, setFilename] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (nota.uri) {
          const NOTE_URL = `https://gateway.lighthouse.storage/ipfs/${nota.uri}`;
          const resp = await axios.get(NOTE_URL);
          setNote(resp.data.description);
          setTags(resp.data.tags);
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
        console.error(error);
        setIsLoading(false);
      }
    }
    fetchData();
  }, [nota.uri]);

  const { displayNameForCurrency } = useTokens();
  const { formatAddress } = useFormatAddress();

  // TODO for some reason not showing cashBeforeDate
  const moduleName = useMemo(() => {
    switch (nota.moduleData.module) {
      case "reversibleRelease":
        return "Reversible Release";
      case "directSend":
        return "Direct Pay";
      case "simpleCash":
        return "Simple Cash";
      case "cashBeforeDate":
        return "Cash Before Date";
      case "reversibleByBeforeDate":
        return "Reversible By Before Date";
      case "cashBeforeDateDrip":
        return "Cash Before Date Drip";
    }
  }, [nota.moduleData.module]);

  const moduleDesc = useMemo(() => {
    switch (nota.moduleData.module) {
      case "directSend":
        return "Funds are released immediately upon payment";
      case "simpleCash":
        return "Allows owner to claim tokens";
      case "cashBeforeDate":
        return "Allows owner to claim tokens before the expiration date";
      case "reversibleRelease":
        return "Funds are held in escrow until released by the payer";
      case "reversibleByBeforeDate":
        return "Allows the sender to reverse the payment only before the expiration date";
      case "cashBeforeDateDrip":
        return "Allows the owner to claim tokens in drips before the expiration date";
    }
  }, [nota.moduleData.module]);

  // TODO need to iterate over moduleData to dynamically show each field in the modal
  return (
    <VStack gap={4} mt={10} mb={6}>
      <RoundedBox px={6}>
        <VStack gap={0}>
          <DetailsRow
            title="Payer"
            value={formatAddress(nota.payer)}
            copyValue={!nota.isPayer ? nota.payer : undefined}
          />
          <DetailsRow
            title="Recipient"
            value={formatAddress(nota.payee)}
            copyValue={!nota.isPayer ? undefined : nota.payee}
          />
          <DetailsRow
            title="Payment Amount"
            value={
              String(nota.amount) +
              " " +
              displayNameForCurrency(nota.token as NotaCurrency)
            }
          />
          {nota.inspector && (
            <DetailsRow
              title="Inspector"
              value={formatAddress(nota.inspector)}
              copyValue={!nota.isInspector ? undefined : nota.payee}
            />
          )}
          <DetailsRow title="Module" value={moduleName} tooltip={moduleDesc} />
          <DetailsRow
            title="Created On"
            value={nota.createdTransaction.date.toDateString()}
            link={`${explorer}${nota.createdTransaction.hash}`}
          />
          {nota.fundedTransaction && (
            <DetailsRow
              title="Funded Date"
              value={nota.fundedTransaction.date.toDateString()}
              link={`${explorer}${nota.fundedTransaction.hash}`}
            />
          )}
        </VStack>
      </RoundedBox>
      {nota.uri &&
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
            {tags && (
              <VStack gap={0} w="100%">
                <Text pl={6} fontWeight={600} w="100%" textAlign={"left"}>
                  Tags
                </Text>
                <RoundedBox p={4} mb={4}>
                  <HStack spacing={4}>
                    {tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </HStack>
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

export default NotaDetails;
