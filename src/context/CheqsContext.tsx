import { createContext, useCallback, useContext, useState } from "react";
import { Cheq, useCheqs } from "../hooks/useCheqs";

interface CheqsContextInterface {
  cheqs: Cheq[] | undefined;
  refresh: () => void;
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
});

export const CheqsProvider = ({ children }: { children: React.ReactNode }) => {
  const [cheqField, setCheqFieldInternal] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const { cheqs, refresh } = useCheqs({ cheqField });

  const setCheqField = useCallback((cheqField: string) => {
    setCheqFieldInternal(cheqField);
  }, []);

  return (
    <CheqsContext.Provider value={{ cheqs, refresh, isLoading, setCheqField }}>
      {children}
    </CheqsContext.Provider>
  );
};

export function useCheqContext() {
  return useContext(CheqsContext);
}
