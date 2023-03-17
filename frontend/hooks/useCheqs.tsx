import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheqCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";

interface Props {
  cheqField: string;
}

export interface CheqDates {
  created: Date;
}

export interface CheqTransaction {
  date: Date;
  hash: string;
}

export type DirectPayStatus = "paid" | "awaiting_payment" | "payable";

export type EscrowStatus =
  | "voided"
  | "released"
  | "awaiting_release"
  | "releasable"
  | "awaiting_escrow"
  | "payable";

export interface EscrowModuleData {
  status: EscrowStatus;
  isSelfSigned: boolean;
  module: "escrow";
}

export interface DirectPayModuleData {
  status: DirectPayStatus;
  module: "direct";
}

export interface Cheq {
  id: string;
  amount: number;
  amountRaw: BigNumber;
  sender: string;
  receiver: string;
  owner: string;
  token: CheqCurrency;
  isInvoice: boolean;
  createdTransaction: CheqTransaction;
  fundedTransaction: CheqTransaction | null;
  isPayer: boolean;
  uri: string;
  payer: string;
  payee: string;
  dueDate?: Date;
  moduleData: EscrowModuleData | DirectPayModuleData;
  inspector?: string;
  isInspector: boolean;
}

const convertExponent = (amountExact: number) => {
  // Use right exponent
  return Number(BigInt(amountExact) / BigInt(10 ** 16)) / 100;
};

const formatAddress = (adress: string, account: string) => {
  if (adress.toLowerCase() === account.toLowerCase()) {
    return "You";
  }
  return adress.slice(0, 5) + "..." + adress.slice(-4);
};

export const useCheqs = ({ cheqField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [cheqsReceived, setCheqReceived] = useState<Cheq[] | undefined>(
    undefined
  );
  const [cheqsSent, setCheqsSent] = useState<Cheq[] | undefined>(undefined);
  const [cheqsInspected, setCheqsInspected] = useState<Cheq[] | undefined>(
    undefined
  );

  const [isLoading, setIsLoading] = useState(false);

  const currencyForTokenId = useCallback(
    (tokenAddress: string): CheqCurrency => {
      switch (tokenAddress) {
        case blockchainState.dai?.address.toLowerCase():
          return "DAI";
        case blockchainState.weth?.address.toLowerCase():
          return "WETH";
        default:
          return "NATIVE";
      }
    },
    [blockchainState.dai?.address, blockchainState.weth?.address]
  );

  const mapField = useCallback(
    (gqlCheq: any) => {
      // TODO: Move this logic to graph (mappings.ts)

      const allEscrows = [...gqlCheq.escrows].sort((a: any, b: any) => {
        return Number(a.timestamp) - Number(b.timestamp);
      });
      const createdTx =
        allEscrows.length > 0 ? allEscrows[0].transaction.id : null;

      const isInvoice = gqlCheq.sender.id === gqlCheq.owner.id;

      const escrowedCheqs = gqlCheq.escrows.filter(
        (gqlCheq: any) =>
          BigInt(gqlCheq.amount) > 0 || BigInt(gqlCheq.instantAmount) > 0
      );
      const { fundedDate, fundedTx } =
        escrowedCheqs.length > 0
          ? {
              fundedDate: new Date(Number(escrowedCheqs[0].timestamp) * 1000),
              fundedTx: escrowedCheqs[0].transaction.id,
            }
          : {
              fundedDate: null,
              fundedTx: null,
            };

      const payer = isInvoice
        ? (gqlCheq.receiver.id as string)
        : (gqlCheq.sender.id as string);

      const payee = isInvoice
        ? (gqlCheq.sender.id as string)
        : (gqlCheq.receiver.id as string);

      const isPayer = payer === blockchainState.account.toLowerCase();

      const isInspector = gqlCheq.inspector?.id === blockchainState.account;

      let dueDate: Date | undefined = undefined;

      if (gqlCheq.moduleData.dueDate) {
        dueDate = new Date(Number(gqlCheq.moduleData.dueDate) * 1000);
      }

      let moduleData: EscrowModuleData | DirectPayModuleData;

      if (gqlCheq.moduleData.__typename === "DirectPayData") {
        const status = gqlCheq.moduleData.status;
        let viewerStatus: DirectPayStatus = "awaiting_payment";
        if (status === "AWAITING_PAYMENT") {
          if (payer) {
            viewerStatus = "payable";
          } else {
            viewerStatus = "awaiting_payment";
          }
        } else {
          viewerStatus = "paid";
        }
        moduleData = { module: "direct", status: viewerStatus };
      } else if (gqlCheq.moduleData.__typename === "ReversiblePaymentData") {
        const status = gqlCheq.moduleData.status;
        let viewerStatus: EscrowStatus = "awaiting_escrow";
        switch (status) {
          case "AWAITING_ESCROW":
            if (payer) {
              viewerStatus = "payable";
            } else {
              viewerStatus = "awaiting_escrow";
            }
            break;
          case "AWAITING_RELEASE":
            if (isInspector) {
              viewerStatus = "releasable";
            } else {
              viewerStatus = "awaiting_release";
            }
            break;
          case "RELEASED":
            viewerStatus = "released";
            break;
          case "VOIDED":
            viewerStatus = "voided";
        }
        moduleData = {
          module: "escrow",
          status: viewerStatus,
          isSelfSigned: gqlCheq.moduleData.isSelfSigned,
        };
      }

      return {
        id: gqlCheq.id as string,
        amount: convertExponent(gqlCheq.moduleData.amount as number),
        amountRaw: BigNumber.from(gqlCheq.moduleData.amount),
        token: currencyForTokenId(gqlCheq.erc20.id),
        receiver: gqlCheq.receiver.id as string,
        sender: gqlCheq.sender.id as string,
        owner: gqlCheq.owner.id as string,
        createdTransaction: {
          date: new Date(Number(gqlCheq.timestamp) * 1000),
          hash: createdTx,
        },
        fundedTransaction:
          fundedDate && fundedTx
            ? {
                date: fundedDate,
                hash: fundedTx,
              }
            : null,
        isInvoice,
        uri: gqlCheq.uri,
        isPayer,
        payer,
        payee,
        dueDate,
        moduleData,
        inspector: gqlCheq.inspector
          ? (gqlCheq.inspector?.id as string)
          : undefined,
        isInspector,
      };
    },
    [blockchainState.account, currencyForTokenId]
  );

  const refresh = useCallback(() => {
    if (account) {
      setIsLoading(true);
      const tokenFields = `      
      id
      escrowed
      timestamp
      uri
      sender {
        id
      }
      receiver {
        id
      }
      owner {
        id
      }
      erc20 {
        id
      }
      inspector {
        id
      }
      moduleData {
        ... on DirectPayData {
          __typename
          status
          amount
          creditor {
            id
          }
          debtor {
            id
          }
          dueDate
        }
        ... on ReversiblePaymentData {
          __typename
          status
          amount
          isSelfSigned
          creditor {
            id
          }
          debtor {
            id
          }
          dueDate
        }
      }
      escrows {
        id
        amount
        instantAmount
        emitter {
          id
        }
        timestamp
        transaction {
          id
        }
      }
      `;

      // TODO: pagination
      const tokenQuery = `
      query accounts($account: String ){
        accounts(where: { id: $account }, first: 1)  {
          cheqsSent(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
          cheqsReceived(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
          cheqsInspected(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
       }
      }
      `;

      const client = new ApolloClient({
        uri: blockchainState.graphUrl,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: gql(tokenQuery),
          variables: {
            account: account.toLowerCase(),
          },
        })
        .then((data) => {
          console.log({ data });
          if (data["data"]["accounts"][0]) {
            const gqlCheqsSent = data["data"]["accounts"][0][
              "cheqsSent"
            ] as any[];
            const gqlCheqsReceived = data["data"]["accounts"][0][
              "cheqsReceived"
            ] as any[];
            const gqlCheqsInspected = data["data"]["accounts"][0][
              "cheqsInspected"
            ] as any[];
            setCheqsSent(gqlCheqsSent.map(mapField));
            setCheqReceived(gqlCheqsReceived.map(mapField));
            setCheqsInspected(gqlCheqsInspected.map(mapField));
          } else {
            setCheqsSent([]);
            setCheqReceived([]);
            setCheqsInspected([]);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
          setIsLoading(false);
        });
    }
  }, [account, blockchainState.graphUrl, mapField]);

  useEffect(() => {
    refresh();
  }, [refresh, account]);

  const cheqs = useMemo(() => {
    if (
      cheqsReceived === undefined ||
      cheqsSent === undefined ||
      cheqsInspected === undefined ||
      isLoading
    ) {
      return undefined;
    }
    const nonSelfSigned = cheqsInspected.filter(
      (cheq: Cheq) =>
        cheq.moduleData.module === "escrow" && !cheq.moduleData.isSelfSigned
    );
    switch (cheqField) {
      case "cheqsSent":
        return cheqsSent;
      case "cheqsReceived":
        return cheqsReceived;
      default:
        return cheqsReceived
          .concat(cheqsSent)
          .concat(nonSelfSigned)
          .sort((a, b) => {
            return (
              b.createdTransaction.date.getTime() -
              a.createdTransaction.date.getTime()
            );
          });
    }
  }, [cheqField, cheqsInspected, cheqsReceived, cheqsSent, isLoading]);

  return { cheqs, refresh };
};
