import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Nota = {
  paymentId: string;
  onchainId: string;
  createdAt: string;
  paymentAmount: number;
  userId: string;
  recoveryStatus: string;
  mintTx: string;
};

// Create the context type
type NotaContextType = {
  notas: Nota[];
  refresh: () => void;
};

// Create the context with default values
const NotaContext = createContext<NotaContextType>({
  notas: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refresh: () => {},
});

const statusForRecoveryState = (recoveryState: number) => {
  switch (recoveryState) {
    case 0:
      return "Covered";
    case 1:
      return "Recovery Started";
  }
  return "";
};

// Create the context provider
export const NotaProvider = ({ children }: { children: React.ReactNode }) => {
  const [notas, setNotas] = useState<Nota[] | undefined>(undefined);

  const fetchNotas = useCallback(async () => {
    const response = await axios.get("https://denota.klymr.me/notas", {
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
    });
    const notas = response.data.map((item) => ({
      paymentId: item.id.toString(),
      onchainId:
        item.onchain_id !== undefined ? item.onchain_id.toString() : "",
      createdAt: item.created_at,
      paymentAmount: item.payment_amount,
      userId: item.user_id.substring(0, 8),
      recoveryStatus: statusForRecoveryState(item.recovery_status),
      riskScore: item.risk_score,
      mintTx: item.mint_tx_hash,
    }));
    setNotas(notas);
  }, []);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  return (
    <NotaContext.Provider value={{ notas: notas, refresh: fetchNotas }}>
      {children}
    </NotaContext.Provider>
  );
};

// Create a custom hook to use the OnrampNota context
export const useNotas = () => {
  const context = useContext(NotaContext);
  if (!context) {
    throw new Error("useNotas must be used within a NotaProvider");
  }
  return context;
};
