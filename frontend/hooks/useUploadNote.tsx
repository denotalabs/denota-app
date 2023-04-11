import axios from "axios";
import { useCallback } from "react";

const METADATA_SERVICE_URL_LOCAL = "http://127.0.0.1:3001/lighthouse";

const METADATA_SERVICE = "https://denota.klymr.me/nft-lighthouse";

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

    const notaFormValues = new FormData();

    if (file) {
      notaFormValues.append("file", file);
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
      notaFormValues.append("document", blob);
    }

    try {
      const resp = await axios.post(METADATA_SERVICE, notaFormValues, config);
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
