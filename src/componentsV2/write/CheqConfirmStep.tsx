import { Button, Text } from "@chakra-ui/react";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqConfirmStep({ isInvoice }: Props) {
  return (
    <>
      <Text fontWeight={600} fontSize={"lg"}>
        {isInvoice ? "Confirm Invoice" : "Confirm Cheq"}
      </Text>
      <Button mt={4}>Confirm</Button>
    </>
  );
}

export default CheqConfirmStep;
