// import { CashBeforeDateData } from "@denota-labs/denota-sdk/dist/modules/CashBeforeDate";
// import { SimpleCashData } from "@denota-labs/denota-sdk/dist/modules/SimpleCash";
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
  CashBeforeDateDripModuleData,
  CashBeforeDateModuleData,
  DirectSendModuleData,
  Nota,
  ReversibleByBeforeDateModuleData,
  ReversibleReleaseModuleData,
  SimpleCashModuleData,
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

interface OptimisticNotaProps {
  id: string;
  token: NotaCurrency;
  amount: number;
  module: "directSend" | "simpleCash" | "reversibleRelease" | "cashBeforeDate" | "cashBeforeDateDrip" | "reversibleByBeforeDate";
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
      amount,
      sender,
      receiver,
      owner,
      token,
      uri,
      inspector,
      isCrossChain,
      createdHash,
      module,
    }: OptimisticNotaProps) => {
      const payer = sender;
      const payee = receiver;
      const isPayer = blockchainState.account === payer;
      const isInspector = blockchainState.account === inspector;

      // TODO need to link these from the SDK
      let moduleData: DirectSendModuleData | SimpleCashModuleData | CashBeforeDateModuleData | ReversibleReleaseModuleData | ReversibleByBeforeDateModuleData | CashBeforeDateDripModuleData;

      switch (module) {
        case "directSend":
          moduleData = {
            module: "directSend",
            status: "paid",
          };
          break;
        case "simpleCash":
          moduleData = {
            module: "simpleCash",
            status: "claimable",
          };
        case "reversibleRelease":
          moduleData = {
            module: "reversibleRelease",
            status: "releasable",
          };
        case "cashBeforeDate":
          moduleData = {
            module: "cashBeforeDate",
            status: "awaiting_claim",
          };
        case "cashBeforeDateDrip":
          moduleData = {
            module: "cashBeforeDateDrip",
            status: "awaiting_claim",
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
        uri,
        payee,
        payer,
        inspector,
        isPayer,
        isInspector,
        createdTransaction: { hash: createdHash, date: new Date() },
        fundedTransaction: { hash: createdHash, date: new Date() },
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
