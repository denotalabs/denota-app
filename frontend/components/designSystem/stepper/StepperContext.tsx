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
  /** Allows a screen to hide the header back arrow (e.g. when it has its own navigation). */
  setBackHidden?: (hidden: boolean) => void;
}

const stepperContext = createContext<StepperContextInterface>({
  currentIndex: 0,
});

export default stepperContext;
