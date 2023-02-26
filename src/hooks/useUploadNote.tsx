import axios from "axios";
import { useCallback } from "react";

const CHEQ_NOTE_SERVICE_URL_LOCAL = "http://127.0.0.1:3001/";

const CHEQ_NOTE_SERVICE = "https://klymr.me/nft";

const CHEQ_FILE_SERVICE = "http://127.0.0.1:3001/";

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

  return { uploadNote, uploadFile };
};
