import { Box } from "@chakra-ui/react";
import { ScreenProps } from "../../designSystem/stepper/Stepper";
import { DetailsStepForm } from "./DetailsStepForm";

export type { DetailsStepFormValues } from "./DetailsStepForm";

const DetailsStep: React.FC<ScreenProps> = () => {
  return (
    <Box w="100%" p={3}>
      <DetailsStepForm />
    </Box>
  );
};

export default DetailsStep;
