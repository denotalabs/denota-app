import { Box, Text, VStack } from "@chakra-ui/react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { Cheq } from "../../../hooks/useCheqs";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  cheq: Cheq;
  maturityDate?: Date;
  isVoided?: boolean;
}

function CheqDetails({ cheq, maturityDate, isVoided }: Props) {
  const { blockchainState } = useBlockchainData();

  return (
    <VStack gap={4} mt={10} mb={6}>
      <RoundedBox px={6}>
        <VStack gap={0}>
          <DetailsRow title="Sender" value={cheq.formattedSender} />
          <DetailsRow title="Recipient" value={cheq.formattedRecipient} />
          <DetailsRow
            title="Created On"
            value={cheq.createdDate.toDateString()}
            link={`${blockchainState.explorer}${cheq.transactions.created}`}
          />
          {cheq.fundedDate && (
            <DetailsRow
              title="Funded Date"
              value={cheq.fundedDate.toDateString()}
              link={`${blockchainState.explorer}${cheq.transactions.funded}`}
            />
          )}
          {!cheq.isCashed && maturityDate && (
            <DetailsRow
              title="Maturity Date"
              value={maturityDate.toDateString()}
            />
          )}
          {cheq.isCashed && cheq.cashedDate && (
            <DetailsRow
              title={isVoided ? "Voided Date" : "Cashed Date"}
              value={cheq.cashedDate?.toDateString()}
              link={`${blockchainState.explorer}${cheq.transactions.cashed}`}
            />
          )}
          <DetailsRow
            title="Payment Amount"
            value={String(cheq.amount) + " " + cheq.token}
          />
          <DetailsRow title="Module" value="Self-signed timelock" />
        </VStack>
      </RoundedBox>
      <RoundedBox p={4} mb={4}>
        <Text fontWeight={600} textAlign={"center"}>
          The self-signed module allows the funder to void the cheq until the
          maturity date (get better copy)
        </Text>
      </RoundedBox>
    </VStack>
  );
}

export default CheqDetails;
