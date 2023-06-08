import Papa from "papaparse";
import { useCallback, useState } from "react";

export interface CsvData {
  recipient: string;
  value: number;
  token: string;
}

export interface BatchDataMap {
  [dest_chain: string]: CsvData[];
}

const useBatchPaymentReader = () => {
  const [data, setData] = useState<BatchDataMap>({});

  const handleFileRead = useCallback(
    async (file: File): Promise<BatchDataMap> => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const dataMap: BatchDataMap = {};
            const rows = results.data as any[];

            for (const row of rows) {
              const { payee, amount, token, dest_chain } = row;

              // Validation
              if (
                typeof payee !== "string" ||
                typeof dest_chain !== "string" ||
                typeof token !== "string"
              ) {
                reject("Invalid data in row: " + JSON.stringify(row));
                return;
              }

              const amountNumber = parseFloat(amount);

              if (isNaN(amountNumber)) {
                reject("Invalid amount in row: " + JSON.stringify(row));
                return;
              }

              if (!dataMap[dest_chain]) {
                dataMap[dest_chain] = [];
              }

              dataMap[dest_chain].push({
                recipient: payee,
                value: amountNumber,
                token,
              });
            }

            setData(dataMap);
            resolve(dataMap);
          },
          error: (error) => {
            console.error("Error:", error);
            reject(error);
          },
        });
      });
    },
    []
  );

  return { data, handleFileRead };
};

export default useBatchPaymentReader;
