import { DownloadIcon } from "@chakra-ui/icons";
import { Center, HStack, Spinner, Tag, Text, VStack } from "@chakra-ui/react";
import { ModuleData } from "@denota-labs/denota-sdk";
import axios from "axios";
import { isAddress } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useFormatAddress } from "../../../hooks/useFormatAddress";
import { Nota } from "../../../hooks/useNotas";
import { useTokens } from "../../../hooks/useTokens";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

function formatModuleDataRows(moduleData: ModuleData) {

  return Object.entries(moduleData)
    .filter(([key, value]) => key !== "moduleName" && key !== "externalURI" && key !== "imageURI" && value !== null && value !== undefined)
    .map(([key, value]) => (
      <DetailsRow
        key={key}
        title={key}
        value={value.toString ? value.toString() : value}
        copyValue={isAddress(value) ? value : ""} />
    ))
}

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

  // TODO need to handle both imageURI and externalURIs with and without lighthouse
  useEffect(() => {
    async function fetchData() {
      try {
        if (nota.moduleData.externalURI) {  // TODO need to check if it's just a hash or a full URL
          if (nota.moduleData.externalURI.startsWith("ipfs://")) {
            const resp = await axios.get(nota.moduleData.externalURI);
            if (resp.data.file) {
              setFile(`https://gateway.lighthouse.storage/ipfs/${resp.data.file}`);
              setFilename(resp.data.filename);
            }
            setIsLoading(false);
          }
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
    switch (nota.moduleData.moduleName) {
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
      default:
        // console.log("Unknown module", nota);
        return "Unknown";
    }
  }, [nota.moduleData.moduleName]);

  const moduleDesc = useMemo(() => {
    switch (nota.moduleData.moduleName) {
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
      default:
        return "Unknown payment terms";
    }
  }, [nota.moduleData.moduleName]);
  // console.log(nota.moduleData);

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
            title="Amount"
            value={
              String(nota.amount) +
              " " +
              displayNameForCurrency(nota.token as NotaCurrency)
            }
          />
          <DetailsRow title="Payment Terms" value={moduleName} tooltip={moduleDesc} />
          {formatModuleDataRows(nota.moduleData)}
          {nota.moduleData.externalURI && (<DetailsRow
            title="External URI"
            value={nota.moduleData.externalURI}
            link={`${nota.moduleData.externalURI}`}
          />)}
          {nota.moduleData.imageURI && (<DetailsRow
            title="Image"
            value={nota.moduleData.imageURI}
            link={`${nota.moduleData.imageURI}`}
          />)}
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
                    {note.charAt(0).toUpperCase() + note.slice(1)}
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
                    {fileName.charAt(0).toUpperCase() + fileName.slice(1)}
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
