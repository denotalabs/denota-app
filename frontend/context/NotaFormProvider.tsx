import { createContext, useCallback, useContext, useState } from "react";

export type StringMap = { [key: string]: string };

export interface ExportNotaFormContext {
  notaFormValues: StringMap;
  updateNotaFormValues: (data: StringMap) => void;
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
  const [notaFormValues, setFormData] = useState<StringMap>({});
  const [file, setFile] = useState<File | undefined>(undefined);

  const updateNotaFormValues = useCallback((data: StringMap) => {
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
