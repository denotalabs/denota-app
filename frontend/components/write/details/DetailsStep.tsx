import { ScreenProps } from "../../designSystem/stepper/Stepper";
import { DetailsStepForm } from "./DetailsStepForm";

export type { DetailsStepFormValues } from "./DetailsStepForm";

const DetailsStep: React.FC<ScreenProps> = () => {
  return <DetailsStepForm />;
};

export default DetailsStep;
