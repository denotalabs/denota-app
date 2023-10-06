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
  riskScore: number;
};

// Create the context type
type NotaContextType = {
  notas: Nota[];
  refresh: () => void;
  updateNota: (paymentId: string, updatedNota: Partial<Nota>) => void;
};

// Create the context with default values
const NotaContext = createContext<NotaContextType>({
  notas: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refresh: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateNota: () => {},
});

// Create the context provider
export const NotaProvider = ({ children }: { children: React.ReactNode }) => {
  const [notas, setNotas] = useState<Nota[]>([]);

  const updateNota = (paymentId: string, updatedNota: Partial<Nota>) => {
    setNotas((prevNotas) =>
      prevNotas.map((nota) =>
        nota.paymentId === paymentId ? { ...nota, ...updatedNota } : nota
      )
    );
  };

  const fetchNotas = useCallback(async () => {
    const response = await axios.get("https://denota.klymr.me/notas", {
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
    });
    const notas = response.data.map((item) => ({
      paymentId: item.id.toString(),
      onchainId: item.onchain_id.toString(),
      createdAt: item.created_at,
      paymentAmount: item.payment_amount,
      userId: item.user_id,
      recoveryStatus: item.recovery_status.toString(),
      riskScore: item.risk_score,
    }));
    setNotas(notas);
  }, []);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  return (
    <NotaContext.Provider
      value={{ notas: notas, refresh: fetchNotas, updateNota }}
    >
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
