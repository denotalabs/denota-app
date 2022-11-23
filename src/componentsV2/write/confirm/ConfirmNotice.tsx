import { Center, Text } from "@chakra-ui/react";

interface Props {
  isInvoice: boolean;
}

function ConfirmNotice({ isInvoice }: Props) {
  return (
    <Center borderRadius={10} bg="gray.700" w="100%" mb={5} padding={6}>
      <Text fontWeight={600} fontSize={"xl"} textAlign="center">
        {isInvoice
          ? "You're sending an invoice. The payer has until the maturity date to request a refund."
          : "You're sending a cheque. You have until the maturity date to request a refund."}
      </Text>
    </Center>
  );
}

export default ConfirmNotice;
