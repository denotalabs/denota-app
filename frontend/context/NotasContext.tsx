import { ModuleData } from "@denota-labs/denota-sdk/";
import { BigNumber } from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
// TODO why are there separate moduleDatas here?
import { Nota } from "@denota-labs/denota-sdk";
import {
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
  instant: number;
  escrowed: number;
  module: string;
  moduleData: ModuleData;

  owner: string;

  sender: string;
  receiver: string;
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
      instant,
      escrowed,
      module,
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

      const totalAmountSent = BigNumber.from(escrowed).add(BigNumber.from(instant));

      const nota: Nota = {
        id,
        token,
        escrowed: BigNumber.from(escrowed),
        module: module, // TODO need to convert to the address here
        moduleData: moduleData,

        owner: owner,
        approved: owner,
        sender: sender,
        receiver: receiver,
        totalAmountSent: totalAmountSent,
        createdAt: new Date(),

        written: {
          writeBytes: "",
          escrowed: BigNumber.from(escrowed),
          instant: BigNumber.from(instant),
          moduleFee: BigNumber.from(0),
          transaction: {
            timestamp: new Date(),
            hash: createdHash,
            blockNumber: String(0),
          },
        },
        transfers: null,
        funds: null,
        cashes: null,
        approvals: null,
        metadataUpdates: null
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
