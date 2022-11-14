import { Button, Text } from "@chakra-ui/react";
import { useStep } from "../stepper/Stepper";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqModuleStep({ isInvoice }: Props) {
  const { next } = useStep();

  return (
    <>
      <Text fontWeight={600} fontSize={"lg"}>
        {isInvoice ? "Milestones" : "Cheq"}
      </Text>
      <Button
        mt={4}
        onClick={() => {
          next?.();
        }}
      >
        Next
      </Button>
    </>
  );
}

export default CheqModuleStep;
