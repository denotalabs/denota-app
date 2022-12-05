import StepperContext, {
  StepperReducerInterface,
  StringMap,
} from "./StepperContext";
import {
  useEffect,
  useReducer,
  Children,
  ReactNode,
  ReactElement,
  useContext,
  useState,
} from "react";
import { Text } from "@chakra-ui/react";
import StepperHeader from "./StepperHeader";
import { stat } from "fs";

interface StepperProps {
  children: ReactNode;
  onClose?: () => void;
}

enum StepperActionKind {
  SET_SCREEN = "SET_SCREEN",
  NEXT = "NEXT",
  BACK = "BACK",
}

interface StepperAction {
  type: StepperActionKind;
  screenKey?: string;
}

function reducer(state: StepperReducerInterface, action: StepperAction) {
  const { type, screenKey } = action;
  switch (type) {
    case StepperActionKind.NEXT: {
      const length = state.allScreens?.length ?? 0;
      const currentIndex =
        state.currentIndex < length - 1
          ? state.currentIndex + 1
          : state.currentIndex;
      const currentScreen = state.allScreens?.[currentIndex];
      return { ...state, currentIndex, currentScreen };
    }
    case StepperActionKind.BACK: {
      const currentIndex =
        state.currentIndex > 0 ? state.currentIndex - 1 : state.currentIndex;
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
    default:
      return { ...state };
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
  const [formData, setFormData] = useState<StringMap>({});
  const next = () => {
    dispatch({ type: StepperActionKind.NEXT });
  };
  const back = () => {
    dispatch({ type: StepperActionKind.BACK });
  };
  const goToStep = (screenKey: string) => {
    dispatch({ type: StepperActionKind.SET_SCREEN, screenKey });
  };
  const appendFormData = (data: StringMap) => {
    setFormData({
      ...formData,
      ...data,
    });
  };
  return (
    <StepperContext.Provider
      value={{
        ...state,
        next,
        back,
        goToStep,
        onClose,
        formData,
        appendFormData,
      }}
    >
      <StepperHeader
        back={back}
        onClose={onClose}
        currentIndex={state.currentIndex}
      />
      {state.currentScreen}
    </StepperContext.Provider>
  );
}

export function useStep() {
  return useContext(StepperContext);
}

export default Stepper;
