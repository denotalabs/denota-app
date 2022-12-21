import { Box, Text, VStack } from "@chakra-ui/react";
import { Cheq } from "../../../hooks/useCheqs";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  cheq: Cheq;
}

function CheqDetails({ cheq }: Props) {
  return (
    <RoundedBox mt={8} p={6}>
      <VStack>
        <DetailsRow title="Sender" value={cheq.sender} />
        <DetailsRow title="Recipient" value={cheq.recipient} />

        <DetailsRow
          title="Payment Amount"
          value={String(cheq.amount) + " " + cheq.token}
        />
        {/* TODO: show maturity date */}
        <DetailsRow title="Broker" value="Self-signed timelock" />
      </VStack>
    </RoundedBox>
  );
}

export default CheqDetails;
