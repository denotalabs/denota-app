import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Cheq, useCheqs } from "../hooks/useCheqs";

interface CheqsContextInterface {
  cheqs: Cheq[] | undefined;
  refresh: () => void;
  refreshWithDelay: () => void;
  isLoading: boolean;
  setCheqField: (cheqField: string) => void;
}

export const CheqsContext = createContext<CheqsContextInterface>({
  cheqs: [],
  refresh: () => {
    return;
  },
  isLoading: false,
  setCheqField: () => {
    return;
  },
  refreshWithDelay: () => {
    return;
  },
});

export const CheqsProvider = ({ children }: { children: React.ReactNode }) => {
  const [cheqField, setCheqFieldInternal] = useState("all");
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);

  const { cheqs, refresh } = useCheqs({ cheqField });

  const setCheqField = useCallback((cheqField: string) => {
    setCheqFieldInternal(cheqField);
  }, []);

  const refreshWithDelay = useCallback(() => {
    setIsLoadingInternal(true);
    setTimeout(() => {
      refresh();
      setIsLoadingInternal(false);
    }, 2000);
  }, [refresh]);

  const isLoading = useMemo(() => {
    if (cheqs === undefined) {
      return true;
    }
    return isLoadingInternal;
  }, [cheqs, isLoadingInternal]);

  return (
    <CheqsContext.Provider
      value={{ cheqs, refresh, isLoading, setCheqField, refreshWithDelay }}
    >
      {children}
    </CheqsContext.Provider>
  );
};

export function useCheqContext() {
  return useContext(CheqsContext);
}
