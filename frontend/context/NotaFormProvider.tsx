import { createContext, useCallback, useContext, useState } from "react";

// TODO: make more type safe
export type DataMap = { [key: string]: any };

export interface ExportNotaFormContext {
  notaFormValues: DataMap;
  updateNotaFormValues: (data: DataMap) => void;
  file?: File;
  setFile?: (file: File) => void;
}

const NotaFormContext = createContext<ExportNotaFormContext>({
  notaFormValues: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateNotaFormValues: () => {},
});

export const NotaFormProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notaFormValues, setFormData] = useState<DataMap>({});
  const [file, setFile] = useState<File | undefined>(undefined);

  const updateNotaFormValues = useCallback((data: DataMap) => {
    setFormData((notaFormValues) => ({
      ...notaFormValues,
      ...data,
    }));
  }, []);

  return (
    <NotaFormContext.Provider
      value={{ notaFormValues, updateNotaFormValues, file, setFile }}
    >
      {children}
    </NotaFormContext.Provider>
  );
};

export function useNotaForm() {
  return useContext(NotaFormContext);
}
