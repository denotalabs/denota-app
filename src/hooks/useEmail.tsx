import axios from "axios";
import { useCallback } from "react";

const DENOTA_EMAIL_SERVICE_URL_LOCAL = "http://127.0.0.1:3001/";

export const useEmail = () => {
  const sendEmail = useCallback(
    async (
      email: string,
      txHash: string,
      network: string,
      token: string,
      amount: number,
      isInvoice: boolean
    ) => {
      try {
        await axios.post(DENOTA_EMAIL_SERVICE_URL_LOCAL, {
          email,
          txHash,
          network,
          token,
          amount,
          isInvoice,
        });
      } catch (error) {
        console.log(error);
      }
    },
    []
  );
  return { sendEmail };
};
