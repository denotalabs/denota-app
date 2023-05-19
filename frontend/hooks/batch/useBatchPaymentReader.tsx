import Papa from 'papaparse';
import { useState } from 'react';

interface CsvData {
  payee: string;
  amount: number;
  token: string;
}

interface DataMap {
  [dest_chain: string]: CsvData[];
}

const useCsvReader = () => {
  const [data, setData] = useState<DataMap>({});

  const handleFileRead = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const dataMap: DataMap = {};
        const rows = results.data as any[];

        for (const row of rows) {
          const { payee, amount, token, dest_chain } = row;

          // Validation
          if (typeof payee !== 'string' || typeof dest_chain !== 'string' || typeof token !== 'string') {
            console.error("Invalid data in row:", row);
            continue;
          }

          const amountNumber = parseFloat(amount);

          if (isNaN(amountNumber)) {
            console.error("Invalid amount in row:", row);
            continue;
          }

          if (!dataMap[dest_chain]) {
            dataMap[dest_chain] = [];
          }

          dataMap[dest_chain].push({ payee, amount: amountNumber, token });
        }

        setData(dataMap);
      },
      error: (error) => {
        console.error("Error:", error);
      },
    });
  };

  return { data, handleFileRead };
};

export default useCsvReader;
