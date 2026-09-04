import { createContext, useCallback, useContext, useState } from "react";

// TODO: make more type safe
export type DataMap = { [key: string]: any };

export interface BalanceCheckCache {
  account: string;
  token: string;
  amount: string;
  insufficientBalance: boolean;
}

export interface ExportNotaFormContext {
  notaFormValues: DataMap;
  updateNotaFormValues: (data: DataMap) => void;
  file?: File;
  setFile?: (file: File) => void;
  balanceCheckCache: BalanceCheckCache | null;
  setBalanceCheckCache: (cache: BalanceCheckCache | null) => void;
}

const NotaFormContext = createContext<ExportNotaFormContext>({
  notaFormValues: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateNotaFormValues: () => { },
  balanceCheckCache: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setBalanceCheckCache: () => { },
});

export const NotaFormProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // `module` is set by the Payment Terms step (or to "directSend" for
  // payments without terms); nothing can be written until then.
  const [notaFormValues, setFormData] = useState<DataMap>({
    module: "",
    expirationDate: "",
  });
  const [file, setFile] = useState<File | undefined>(undefined);
  const [balanceCheckCache, setBalanceCheckCache] =
    useState<BalanceCheckCache | null>(null);

  const updateNotaFormValues = useCallback((data: DataMap) => {
    setFormData((notaFormValues) => ({
      ...notaFormValues,
      ...data,
    }));
  }, []);

  return (
    <NotaFormContext.Provider
      value={{
        notaFormValues,
        updateNotaFormValues,
        file,
        setFile,
        balanceCheckCache,
        setBalanceCheckCache,
      }}
    >
      {children}
    </NotaFormContext.Provider>
  );
};

export function useNotaForm() {
  return useContext(NotaFormContext);
}
