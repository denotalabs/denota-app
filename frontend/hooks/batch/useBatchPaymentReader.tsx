import Papa from "papaparse";
import { useCallback, useState } from "react";

interface CsvData {
  payee: string;
  amount: number;
  token: string;
}

export interface DataMap {
  [dest_chain: string]: CsvData[];
}

const useBatchPaymentReader = () => {
  const [data, setData] = useState<DataMap>({});

  const handleFileRead = useCallback(async (file: File): Promise<DataMap> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const dataMap: DataMap = {};
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

            dataMap[dest_chain].push({ payee, amount: amountNumber, token });
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
  }, []);

  return { data, handleFileRead };
};

export default useBatchPaymentReader;
