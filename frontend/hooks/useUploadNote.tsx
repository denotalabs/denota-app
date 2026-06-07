import { useCallback } from "react";
import { uploadFileToPinata } from "../utils/uploadToPinata";

export const useUploadMetadata = () => {
  const upload = useCallback(
    async (file?: File, note?: string, tags?: string) => {
      if (!file && !note?.trim() && !tags?.trim()) {
        return;
      }

      try {
        let uploadFile: File;

        if (file) {
          uploadFile = file;
        } else {
          const payload: Record<string, unknown> = {};
          if (note?.trim()) {
            payload.description = note.trim();
          }
          if (tags?.trim()) {
            payload.tags = tags.split(",").map((tag) => tag.trim());
          }
          uploadFile = new File([JSON.stringify(payload)], "metadata.json", {
            type: "application/json",
          });
        }

        const cid = await uploadFileToPinata(uploadFile);
        if (!cid) {
          return { ipfsHash: undefined, imageURI: undefined };
        }

        return {
          ipfsHash: cid,
          imageURI: `ipfs://${cid}`,
        };
      } catch (error) {
        console.error(error);
        return { ipfsHash: undefined, imageURI: undefined };
      }
    },
    []
  );

  return { upload };
};
