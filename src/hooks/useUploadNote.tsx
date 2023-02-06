import { useCallback } from "react";

import axios from "axios";

const CHEQ_NOTE_SERVICE_URL_LOCAL = "http://127.0.0.1:3001/";

const CHEQ_NOTE_SERVICE = "https://klymr.me/nft";

export const useUploadNote = () => {
  const uploadNote = useCallback(async (note: string) => {
    try {
      const resp = await axios.post(CHEQ_NOTE_SERVICE, {
        name: "Cheq",
        description: note,
        mode: "S3",
      });
      return resp.data.key as string;
    } catch {
      return undefined;
    }
  }, []);

  return { uploadNote };
};
