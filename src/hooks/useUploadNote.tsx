import axios from "axios";
import { useCallback } from "react";

const CHEQ_NOTE_SERVICE_URL_LOCAL = "http://127.0.0.1:3001/";

const CHEQ_NOTE_SERVICE = "https://klymr.me/nft";

export const useUploadNote = () => {
  const uploadFile = useCallback(async (file: any, note: string) => {
    if (!file && !note) {
      return;
    }
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (note) {
        const rqData = {
          desc: note,
        };

        const json = JSON.stringify(rqData);
        const blob = new Blob([json], {
          type: "application/json",
        });
        formData.append("document", blob);
      }

      const resp = await axios.post(CHEQ_NOTE_SERVICE, formData, config);
      console.log(resp.data.url);
      return resp.data.key as string;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }, []);

  return { uploadFile };
};
