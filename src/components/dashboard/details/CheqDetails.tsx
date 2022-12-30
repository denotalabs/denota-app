import { Box, Text, VStack } from "@chakra-ui/react";
import { Cheq } from "../../../hooks/useCheqs";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  cheq: Cheq;
  maturityDate?: Date;
  isVoided?: boolean;
}

function CheqDetails({ cheq, maturityDate, isVoided }: Props) {
  return (
    <VStack gap={4} mt={10} mb={6}>
      <RoundedBox px={6}>
        <VStack gap={0}>
          <DetailsRow title="Sender" value={cheq.formattedSender} />
          <DetailsRow title="Recipient" value={cheq.formattedRecipient} />
          <DetailsRow
            title="Created On"
            value={cheq.createdDate.toDateString()}
          />
          {cheq.fundedDate && (
            <DetailsRow
              title="Funded Date"
              value={cheq.fundedDate.toDateString()}
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
