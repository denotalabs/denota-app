import { ModuleData } from "@denota-labs/denota-sdk/";
import { ethers } from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
// TODO why are there separate moduleDatas here?
import {
  Nota,
  useNotas
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

// TODO change this to the same struct as Nota from the SDK?
interface OptimisticNotaProps {
  id: string;
  token: NotaCurrency;
  amount: number;
  moduleData: ModuleData;
  sender: string;
  receiver: string;
  owner: string;
  createdHash: string;
  uri: string;
  inspector?: string;
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
      token,
      amount,
      moduleData,
      sender,
      receiver,
      owner,
      uri,
      inspector,
      isCrossChain,
      createdHash,
    }: OptimisticNotaProps) => {
      const payer = sender;
      const payee = receiver;
      const isPayer = blockchainState.account === payer;
      const isInspector = blockchainState.account === inspector;

      switch (moduleData.moduleName) {
        case "directSend":
          moduleData = {
            moduleName: "directSend",
            status: "paid",
          };
          break;
        case "simpleCash":
          moduleData = {
            moduleName: "simpleCash",
            status: "claimable",
          };
        case "reversibleRelease":
          moduleData = {
            moduleName: "reversibleRelease",
            status: "releasable",
            inspector: isInspector ? blockchainState.account : undefined,
          };
        case "reversibleByBeforeDate":
          moduleData = {
            moduleName: "reversibleByBeforeDate",
            status: "releasable",
            inspector: isInspector ? blockchainState.account : undefined,
            reversibleByBeforeDate: null,
          };
        case "cashBeforeDate":
          moduleData = {
            moduleName: "cashBeforeDate",
            status: "awaiting_claim",
            cashBeforeDate: null,
          };
        case "cashBeforeDateDrip":
          moduleData = {
            moduleName: "cashBeforeDateDrip",
            status: "awaiting_claim",
            expirationDate: null,
            dripAmount: null,
            dripPeriod: null,
          };
      }

      const nota: Nota = {
        id,
        token,
        amount,
        amountRaw: ethers.utils.parseEther(String(amount)),
        moduleData,
        sender,
        receiver,
        owner,
        createdTransaction: { hash: createdHash, date: new Date() },
        fundedTransaction: { hash: createdHash, date: new Date() },
        isPayer,
        payer,
        payee,
        isInspector,
        uri,
        inspector,
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
