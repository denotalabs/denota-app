import { VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../context/NotaFormProvider";
import Stepper from "../designSystem/stepper/Stepper";
import BridgeStep from "./BridgeStep";
import DisperseStep from "./DisperseStep";
import UploadCSVStep from "./UploadCSVStep";

interface Props {
  onClose?: () => void;
}

export function BatchBridgeFlow({ onClose }: Props) {
  return (
    <VStack
      w="650px"
      bg="brand.100"
      py={2}
      px={4}
      borderRadius="30px"
      spacing={0}
    >
      <NotaFormProvider>
        <Stepper onClose={onClose}>
          <UploadCSVStep
            screenTitle="Upload a CSV to get started"
            screenKey="upload"
          />
          <BridgeStep screenTitle="Bridge" screenKey="bridge" />
          <DisperseStep screenTitle="Disperse" screenKey="disperse" />
        </Stepper>
      </NotaFormProvider>
    </VStack>
  );
}
