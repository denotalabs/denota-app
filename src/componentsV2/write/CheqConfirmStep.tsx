import { Button, Text } from "@chakra-ui/react";
import { useStep } from "../stepper/Stepper";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqConfirmStep({ isInvoice }: Props) {
  const { onClose } = useStep();

  return (
    <>
      <Text fontWeight={600} fontSize={"lg"}>
        {isInvoice ? "Confirm Invoice" : "Confirm Cheq"}
      </Text>
      <Button
        onClick={() => {
          onClose?.();
        }}
        mt={4}
      >
        Confirm
      </Button>
    </>
  );
}

export default CheqConfirmStep;
