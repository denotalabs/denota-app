import { createContext, ReactNode } from "react";

export type StringMap = { [key: string]: string };

export interface StepperReducerInterface {
  currentIndex: number;
  currentScreen?: ReactNode;
  allScreens?: ReactNode[];
}

export interface StepperContextInterface extends StepperReducerInterface {
  next?: () => void;
  back?: () => void;
  goToStep?: (screenKey: string) => void;
  onClose?: () => void;
  formData: StringMap;
  appendFormData: (data: StringMap) => void;
}

const stepperContext = createContext<StepperContextInterface>({
  currentIndex: 0,
  formData: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  appendFormData: () => {},
});

export default stepperContext;
