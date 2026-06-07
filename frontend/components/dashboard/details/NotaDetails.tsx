import { DownloadIcon } from "@chakra-ui/icons";
import { Center, HStack, Spinner, Tag, Text, VStack } from "@chakra-ui/react";
import { ModuleData, Nota } from "@denota-labs/denota-sdk";
import axios from "axios";
import { isAddress } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useEnsNames } from "../../../hooks/useEnsNames";
import { useTokens } from "../../../hooks/useTokens";
import { ipfsToHttpUrl } from "../../../utils/ipfsGateway";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

function collectModuleDataAddresses(moduleData: ModuleData): string[] {
  const seen = new Set<string>();
  for (const [key, value] of Object.entries(moduleData)) {
    if (
      key === "moduleName" ||
      key === "externalURI" ||
      key === "imageURI" ||
      key === "writeBytes" ||
      value === null ||
      value === undefined
    ) {
      continue;
    }
    if (typeof value === "string" && isAddress(value)) {
      seen.add(value.toLowerCase());
    }
  }
  return [...seen];
}

function formatModuleDataRows(
  moduleData: ModuleData,
  ensNames: Map<string, string | null>
) {
  const filterCondition = (key: string, value: unknown) => {
    return (
      key !== "moduleName" &&
      key !== "externalURI" &&
      key !== "imageURI" &&
      key !== "writeBytes" &&
      value !== null &&
      value !== undefined
    );
  };
  return Object.entries(moduleData)
    .filter(([key, value]) => filterCondition(key, value))
    .map(([key, value]) => (
      <DetailsRow
        key={key}
        title={key}
        value={value}
        ensNames={ensNames}
        copyValue={isAddress(value) ? value : ""}
      />
    ));
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

  const ensAddresses = useMemo(
    () => [
      nota.sender,
      nota.receiver,
      ...collectModuleDataAddresses(nota.moduleData),
    ],
    [nota.sender, nota.receiver, nota.moduleData]
  );
  const ensNames = useEnsNames(ensAddresses);

  useEffect(() => {
    async function fetchData() {
      const externalURI = nota.moduleData.externalURI;
      if (!externalURI) {
        setNote("");
        setIsLoading(false);
        return;
      }

      if (externalURI.startsWith("http")) {
        setFile(externalURI);
        setIsLoading(false);
        return;
      }

      const url = ipfsToHttpUrl(externalURI);
      try {
        const resp = await axios.get(url);
        const data = resp.data;

        // Legacy Lighthouse JSON metadata wrapper
        if (
          data &&
          typeof data === "object" &&
          (data.description || data.file || data.tags)
        ) {
          setNote(data.description ?? "");
          setTags(Array.isArray(data.tags) ? data.tags : undefined);
          if (data.file) {
            setFile(ipfsToHttpUrl(data.file));
            setFilename(data.filename ?? "file");
          }
        } else {
          setFile(url);
          setFilename(externalURI.replace(/^ipfs:\/\//, "").slice(0, 16));
        }
      } catch {
        setFile(url);
        setFilename(externalURI.replace(/^ipfs:\/\//, "").slice(0, 16));
      }
      setIsLoading(false);
    }
    fetchData();
  }, [nota.moduleData.externalURI]);

  const { displayNameForCurrency, weiAddressToDisplay, currencyForTokenId } =
    useTokens();

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
        return "Unknown";
    }
  }, [nota.moduleData.moduleName]);

  const moduleDesc = useMemo(() => {
    switch (nota.moduleData.moduleName) {
      case "directSend":
        return "Funds are sent directly to your recipient.";
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

  return (
    <VStack gap={4} mt={10} mb={6}>
      <RoundedBox px={6}>
        <VStack gap={0}>
          <DetailsRow
            title="Payer"
            value={nota.sender}
            ensNames={ensNames}
            copyValue={nota.sender}
          />
          <DetailsRow
            title="Recipient"
            value={nota.receiver}
            ensNames={ensNames}
            copyValue={nota.receiver}
          />
          <DetailsRow
            title="Amount"
            value={
              weiAddressToDisplay(nota.totalAmountSent, nota.token) +
              " " +
              displayNameForCurrency(currencyForTokenId(nota.token))
            }
          />
          <DetailsRow
            title="Payment Terms"
            value={moduleName}
            tooltip={moduleDesc}
          />
          {formatModuleDataRows(nota.moduleData, ensNames)}
          {nota.moduleData.externalURI && (
            <DetailsRow
              title="External URI"
              value={nota.moduleData.externalURI}
              link={ipfsToHttpUrl(nota.moduleData.externalURI)}
            />
          )}
          {nota.moduleData.imageURI && (
            <DetailsRow
              title="Image"
              value={nota.moduleData.imageURI}
              link={ipfsToHttpUrl(nota.moduleData.imageURI)}
            />
          )}
          <DetailsRow
            title="Created On"
            value={nota.createdAt.toLocaleDateString()}
            link={`${explorer}${nota.written.transaction.hash}`}
          />
          {nota.funds.length > 0 && (
            <DetailsRow
              title="Funded Date"
              value={new Date(
                nota.funds[0].transaction.timestamp
              ).toString()}
              link={`${explorer}${nota.funds[0].transaction.hash}`}
            />
          )}
        </VStack>
      </RoundedBox>
      {nota.moduleData.externalURI &&
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
