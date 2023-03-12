import { createContext, useContext, useState } from "react";

export type StringMap = { [key: string]: string };

export interface ExportNotaFormContext {
  formData: StringMap;
  appendFormData: (data: StringMap) => void;
  file?: File;
  setFile?: (file: File) => void;
}

const NotaFormContext = createContext<ExportNotaFormContext>({
  formData: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  appendFormData: () => {},
});

export const NotaFormProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [formData, setFormData] = useState<StringMap>({});
  const [file, setFile] = useState<File | undefined>(undefined);

  const appendFormData = (data: StringMap) => {
    setFormData({
      ...formData,
      ...data,
    });
  };

  return (
    <NotaFormContext.Provider
      value={{ formData, appendFormData, file, setFile }}
    >
      {children}
    </NotaFormContext.Provider>
  );
};

export function useNotaForm() {
  return useContext(NotaFormContext);
}
