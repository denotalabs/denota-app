import { Center, Text } from "@chakra-ui/react";

import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  isInvoice: boolean;
}

function ConfirmNotice({ isInvoice }: Props) {
  return (
    <RoundedBox mb={5} padding={6}>
      <Center>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center">
          {isInvoice
            ? "You're sending an invoice. The payer has until the maturity date to request a refund."
            : "You're sending a cheque. You have until the maturity date to request a refund."}
        </Text>
      </Center>
    </RoundedBox>
  );
}

export default ConfirmNotice;
