import { Box } from "@chakra-ui/react";
import {
  Children,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import StepperContext, { StepperReducerInterface } from "./StepperContext";
import StepperHeader from "./StepperHeader";

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

export interface ScreenProps {
  screenKey: string;
  screenTitle: string;
}

function screenKeyFromNode(screen: ReactNode): string | undefined {
  return (screen as ReactElement)?.props?.screenKey;
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
      )[0];
      const currentIndex = state.allScreens?.indexOf(currentScreen) ?? 0;
      return { ...state, currentIndex, currentScreen };
    }
    default:
      return { ...state };
  }
}

function Stepper({ children, onClose }: StepperProps) {
  const { notaFormValues } = useNotaForm();
  const allScreens: ReactNode[] = Children.toArray(children);
  const currentScreen: ReactNode =
    allScreens.length > 0 ? allScreens[0] : undefined;
  const [state, dispatch] = useReducer(reducer, {
    currentIndex: 0,
    currentScreen,
    allScreens,
  });
  const [backHidden, setBackHidden] = useState(false);

  useEffect(() => {
    setBackHidden(false);
  }, [state.currentIndex]);

  const hasPaymentTermsStep = useMemo(
    () =>
      allScreens.some(
        (child) => screenKeyFromNode(child) === "module"
      ),
    [allScreens]
  );

  const goToStep = (screenKey: string) => {
    dispatch({ type: StepperActionKind.SET_SCREEN, screenKey });
  };

  const next = () => {
    dispatch({ type: StepperActionKind.NEXT });
  };

  const back = () => {
    const currentKey = screenKeyFromNode(state.currentScreen);

    if (currentKey === "confirm") {
      if (notaFormValues.paymentType === "withTerms") {
        goToStep(hasPaymentTermsStep ? "module" : "moduleSelect");
      } else {
        goToStep("write");
      }
      return;
    }

    dispatch({ type: StepperActionKind.BACK });
  };

  const screenTitle = useMemo(() => {
    return (state.currentScreen as ReactElement).props.screenTitle;
  }, [state.currentScreen]);
  return (
    <StepperContext.Provider
      value={{
        ...state,
        next,
        back,
        goToStep,
        onClose,
        setBackHidden,
      }}
    >
      <StepperHeader
        back={back}
        onClose={onClose}
        currentIndex={state.currentIndex}
        title={screenTitle}
        hideBack={backHidden}
      />
      <Box w="100%" minH={{ base: "420px", md: "480px" }}>
        {state.currentScreen}
      </Box>
    </StepperContext.Provider>
  );
}

export function useStep() {
  return useContext(StepperContext);
}

export default Stepper;
