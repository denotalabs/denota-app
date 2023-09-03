import React, { createContext, useContext, useEffect, useState } from "react";

type OnrampNota = {
  paymentId: string;
  date: string;
  amount: number;
  factor: number;
  userId: string;
  paymentStatus: string;
  riskScore: number;
};

// Create the context type
type OnrampNotaContextType = {
  onrampNotas: OnrampNota[];
  addOnrampNota: (nota: OnrampNota) => void;
  updateOnrampNota: (
    paymentId: string,
    updatedNota: Partial<OnrampNota>
  ) => void;
};

// Create the context with default values
const OnrampNotaContext = createContext<OnrampNotaContextType>({
  onrampNotas: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addOnrampNota: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateOnrampNota: () => {},
});

const fakeData: OnrampNota[] = [
  {
    paymentId: "1",
    date: "2023-06-31 21:59:59",
    amount: 100,
    factor: 25.4,
    userId: "111231",
    paymentStatus: "Pending",
    riskScore: 50,
  },
  {
    paymentId: "2",
    date: "2023-07-10 11:34:39",
    amount: 150,
    factor: 30.48,
    userId: "212211",
    paymentStatus: "Pending",
    riskScore: 25,
  },
  {
    paymentId: "3",
    date: "2023-07-08 13:16:29",
    amount: 175,
    factor: 0.91444,
    userId: "122112",
    paymentStatus: "Pending",
    riskScore: 35,
  },
  {
    paymentId: "4",
    date: "2023-07-04 12:08:19",
    amount: 275,
    factor: 0.91444,
    userId: "111122",
    paymentStatus: "Requested",
    riskScore: 35,
  },
];

// Create the context provider
export const OnrampNotaProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [onrampNotas, setOnrampNotas] = useState<OnrampNota[]>([]);

  const addOnrampNota = (nota: OnrampNota) => {
    setOnrampNotas((prevNotas) => [...prevNotas, nota]);
  };

  const updateOnrampNota = (
    paymentId: string,
    updatedNota: Partial<OnrampNota>
  ) => {
    setOnrampNotas((prevNotas) =>
      prevNotas.map((nota) =>
        nota.paymentId === paymentId ? { ...nota, ...updatedNota } : nota
      )
    );
  };

  useEffect(() => {
    setOnrampNotas(fakeData);
  }, []);

  return (
    <OnrampNotaContext.Provider
      value={{ onrampNotas, addOnrampNota, updateOnrampNota }}
    >
      {children}
    </OnrampNotaContext.Provider>
  );
};

// Create a custom hook to use the OnrampNota context
export const useOnrampNota = () => {
  const context = useContext(OnrampNotaContext);
  if (!context) {
    throw new Error("useOnrampNota must be used within an OnrampNotaProvider");
  }
  return context;
};
