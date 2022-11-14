import { createContext, ReactNode } from "react";

export interface StepperReducerInterface {
  currentIndex: number;
  currentScreen?: ReactNode;
  allScreens?: ReactNode[];
}

export interface StepperContextInterface extends StepperReducerInterface {
  next?: () => void;
  goToStep?: (screenKey: string) => void;
  onClose?: () => void;
}

const stepperContext = createContext<StepperContextInterface>({
  currentIndex: 0,
});

export default stepperContext;
