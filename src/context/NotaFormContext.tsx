import { createContext } from "react";

export type StringMap = { [key: string]: string };

export interface ExportNotaFormContext {
  formData: StringMap;
  appendFormData: (data: StringMap) => void;
  file?: File;
  setFile?: (file: File) => void;
}

const notaFormContext = createContext<ExportNotaFormContext>({
  formData: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  appendFormData: () => {},
});

export default notaFormContext;
