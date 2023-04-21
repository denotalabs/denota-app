import { ethers } from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import {
  DirectPayModuleData,
  EscrowModuleData,
  Nota,
  useNotas,
} from "../hooks/useNotas";
import { useBlockchainData } from "./BlockchainDataProvider";

interface NotasContextInterface {
  notas: Nota[] | undefined;
  refresh: () => void;
  refreshWithDelay: () => void;
  isLoading: boolean;
  setNotaField: (notaField: string) => void;
  createLocalNota: (props: OptimisticNotaProps) => void;
}

interface OptimisticNotaProps {
  id: string;
  amount: number;
  sender: string;
  receiver: string;
  owner: string;
  token: NotaCurrency;
  isInvoice: boolean;
  uri: string;
  inspector?: string;
  createdHash: string;
  module: "escrow" | "direct";
  isCrossChain: boolean;
}

export const NotaContext = createContext<NotasContextInterface>({
  notas: [],
  refresh: () => {
    return;
  },
  isLoading: false,
  setNotaField: () => {
    return;
  },
  refreshWithDelay: () => {
    return;
  },
  createLocalNota: () => {
    return;
  },
});

export const NotasProvider = ({ children }: { children: React.ReactNode }) => {
  const [notaField, setNotaFieldInternal] = useState("all");
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
  const { blockchainState } = useBlockchainData();

  const { notas, refresh, addOptimisticNota } = useNotas({
    notaField: notaField,
  });

  const setNotaField = useCallback((notaField: string) => {
    setNotaFieldInternal(notaField);
  }, []);

  const refreshWithDelay = useCallback(() => {
    setIsLoadingInternal(true);
    setTimeout(() => {
      refresh();
      setIsLoadingInternal(false);
    }, 3000);
  }, [refresh]);

  const isLoading = useMemo(() => {
    if (notas === undefined) {
      return true;
    }
    return isLoadingInternal;
  }, [notas, isLoadingInternal]);

  const createLocalNota = useCallback(
    ({
      id,
      amount,
      sender,
      receiver,
      owner,
      token,
      isInvoice,
      uri,
      inspector,
      isCrossChain,
      createdHash,
      module,
    }: OptimisticNotaProps) => {
      const payer = isInvoice ? receiver : sender;
      const payee = isInvoice ? sender : receiver;
      const isPayer = blockchainState.account === payer;
      const isInspector = blockchainState.account === inspector;

      let moduleData: EscrowModuleData | DirectPayModuleData;
      switch (module) {
        case "direct":
          moduleData = {
            module: "direct",
            status: isInvoice ? "awaiting_payment" : "paid",
          };
          break;
        case "escrow":
          moduleData = {
            module: "escrow",
            status: isInvoice ? "awaiting_escrow" : "releasable",
            isSelfSigned: inspector === blockchainState.account,
          };
      }

      const nota: Nota = {
        id,
        amount,
        amountRaw: ethers.utils.parseEther(String(amount)),
        sender,
        receiver,
        owner,
        token,
        isInvoice,
        uri,
        payee,
        payer,
        inspector,
        isCrossChain,
        isPayer,
        isInspector,
        createdTransaction: { hash: createdHash, date: new Date() },
        fundedTransaction: isInvoice
          ? null
          : { hash: createdHash, date: new Date() },
        moduleData,
      };
      addOptimisticNota(nota);
    },
    [addOptimisticNota, blockchainState.account]
  );

  return (
    <NotaContext.Provider
      value={{
        notas,
        refresh,
        isLoading,
        setNotaField,
        refreshWithDelay,
        createLocalNota,
      }}
    >
      {children}
    </NotaContext.Provider>
  );
};

export function useNotaContext() {
  return useContext(NotaContext);
}
