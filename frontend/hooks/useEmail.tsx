import axios from "axios";
import { useCallback } from "react";

const DENOTA_EMAIL_SERVICE_URL_LOCAL = "http://127.0.0.1:3001/";
const DENOTA_EMAIL_SERVICE = "https://denota.klymr.me/email";

interface EmailProps {
  email: string;
  txHash: string;
  network: string;
  token: string;
  amount: string;
  module: string;
}

export const useEmail = () => {
  const sendEmail = useCallback(
    async ({ email, txHash, network, token, amount, module }: EmailProps) => {
      try {
        await axios.post(DENOTA_EMAIL_SERVICE, {
          email,
          txHash,
          network,
          token,
          amount,
          module,
        });
      } catch (error) {
        console.error(error);
      }
    },
    []
  );
  return { sendEmail };
};
