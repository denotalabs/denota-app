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

  const moduleName = useMemo(() => {
    switch (nota.moduleData.module) {
      case "reversibleRelease":
        return "Escrow";
      case "direct":
        return "Direct Pay";
    }
  }, [nota.moduleData.module]);

  const moduleDesc = useMemo(() => {
    switch (nota.moduleData.module) {
      case "reversibleRelease":
        return "Funds are held in escrow until released by the payer";
      case "direct":
        return "Funds are released immediately upon payment";
    }
  }, [nota.moduleData.module]);

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
          {nota.inspector && (
            <DetailsRow
              title="Inspector"
              value={formatAddress(nota.inspector)}
              copyValue={!nota.isInspector ? undefined : nota.payee}
            />
          )}
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
          <DetailsRow
            title="Payment Amount"
            value={
              String(nota.amount) +
              " " +
              displayNameForCurrency(nota.token as NotaCurrency)
            }
          />
          <DetailsRow title="Module" value={moduleName} tooltip={moduleDesc} />
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
