import StepperContext, { StepperReducerInterface } from "./StepperContext";
import {
  useEffect,
  useReducer,
  Children,
  ReactNode,
  ReactElement,
  useContext,
} from "react";
import { Text } from "@chakra-ui/react";

interface StepperProps {
  children: ReactNode;
  onClose?: () => void;
}

enum StepperActionKind {
  SET_SCREEN = "SET_SCREEN",
  NEXT = "NEXT",
}

interface StepperAction {
  type: StepperActionKind;
  screenKey?: string;
}

function reducer(state: StepperReducerInterface, action: StepperAction) {
  const { type, screenKey } = action;
  switch (type) {
    default:
    case StepperActionKind.NEXT: {
      const length = state.allScreens?.length ?? 0;
      const currentIndex =
        state.currentIndex < length - 1
          ? state.currentIndex + 1
          : state.currentIndex;
      const currentScreen = state.allScreens?.[currentIndex];
      return { ...state, currentIndex, currentScreen };
    }
    case StepperActionKind.SET_SCREEN: {
      const currentScreen = state.allScreens?.filter(
        (child) => (child as ReactElement).props.screenKey == screenKey
      );
      const currentIndex = state.allScreens?.indexOf(currentScreen) ?? 0;
      return { ...state, currentIndex, currentScreen };
    }
  }
}

function Stepper({ children, onClose }: StepperProps) {
  const allScreens: ReactNode[] = Children.toArray(children);
  const currentScreen: ReactNode =
    allScreens.length > 0 ? allScreens[0] : undefined;
  const [state, dispatch] = useReducer(reducer, {
    currentIndex: 0,
    currentScreen,
    allScreens,
  });
  const next = () => {
    dispatch({ type: StepperActionKind.NEXT });
  };
  const goToStep = (screenKey: string) => {
    dispatch({ type: StepperActionKind.SET_SCREEN, screenKey });
  };
  return (
    <StepperContext.Provider value={{ ...state, next, goToStep, onClose }}>
      <Text fontWeight={600} fontSize={"xl"} mb={8}>
        Invoice Step {state.currentIndex + 1}
      </Text>
      {state.currentScreen}
    </StepperContext.Provider>
  );
}

export function useStep() {
  return useContext(StepperContext);
}

export default Stepper;
