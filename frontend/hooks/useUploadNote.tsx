import axios from "axios";
import { useCallback } from "react";

const CHEQ_NOTE_SERVICE_URL_LOCAL = "http://127.0.0.1:3001/lighthouse";

const CHEQ_NOTE_SERVICE = "https://denota.klymr.me/nft-lighthouse";

interface NotaMetadata {
  desc?: string;
  tags?: string;
}

export const useUploadMetadata = () => {
  const upload = useCallback(async (file: any, note: string, tags: string) => {
    if (!file && !note && !tags) {
      return;
    }
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    if (note || tags) {
      const rqData: NotaMetadata = {};

      if (note) {
        rqData.desc = note;
      }

      if (tags) {
        rqData.tags = tags;
      }

      const json = JSON.stringify(rqData);
      const blob = new Blob([json], {
        type: "application/json",
      });
      formData.append("document", blob);
    }

    try {
      const resp = await axios.post(CHEQ_NOTE_SERVICE, formData, config);
      console.log(resp.data);
      return {
        ipfsHash: resp.data.key as string,
        imageUrl: resp.data.imageUrl as string,
      };
    } catch (error) {
      console.log(error);
      return { ipfsHash: undefined, imageUrl: undefined };
    }
  }, []);

  return { upload };
};
