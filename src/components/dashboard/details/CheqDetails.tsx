import { Text, VStack } from "@chakra-ui/react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { Cheq } from "../../../hooks/useCheqs";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  cheq: Cheq;
  payer: string;
  payee: string;
  maturityDate?: Date;
  isVoided?: boolean;
}

function CheqDetails({ cheq, maturityDate, isVoided, payer, payee }: Props) {
  const { blockchainState } = useBlockchainData();

  return (
    <VStack gap={4} mt={10} mb={6}>
      <RoundedBox px={6}>
        <VStack gap={0}>
          <DetailsRow title="Payer" value={payer} />
          <DetailsRow title="Recipient" value={payee} />
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
          {!cheq.isCashed && maturityDate && (
            <DetailsRow
              title="Maturity Date"
              value={maturityDate.toDateString()}
            />
          )}
          {cheq.isCashed && cheq.cashedTransaction && (
            <DetailsRow
              title={isVoided ? "Voided Date" : "Cashed Date"}
              value={cheq.cashedTransaction.date.toDateString()}
              link={`${blockchainState.explorer}${cheq.cashedTransaction.hash}`}
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
