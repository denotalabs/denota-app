import { Center, VStack } from "@chakra-ui/react";
import ConfirmDetailsRow from "./ConfirmDetailsRow";

function ConfirmDetails() {
  return (
    <VStack borderRadius={10} bg="gray.700" w="100%" p={6}>
      <ConfirmDetailsRow title="Client address" value="0xDEADBEEF" />
      <ConfirmDetailsRow title="Payment Amount" value="42 wETH" />
      <ConfirmDetailsRow title="Maturity Date" value="Jan 23, 2023" />
    </VStack>
  );
}

export default ConfirmDetails;
