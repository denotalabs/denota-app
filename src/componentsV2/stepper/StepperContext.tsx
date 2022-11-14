import { createContext, ReactNode } from "react";

export interface StepperContextInterface {
  currentIndex: number;
  currentScreen?: ReactNode;
  allScreens?: ReactNode[];
}

export interface StepperContextInterface2 extends StepperContextInterface {
  next?: () => void;
  goToStep?: (screenKey: string) => void;
}

const stepperContext = createContext<StepperContextInterface2>({
  currentIndex: 0,
});

export default stepperContext;
