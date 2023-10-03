import { Link, VStack } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import NextLink from "next/link";
import { useMemo } from "react";
import { OnrampNota, useOnrampNota } from "../../context/OnrampDataProvider";
import { PaymentActions } from "../onramps/PaymentActions";
import { DataTable } from "./table/NotaTable";

const columnHelper = createColumnHelper<OnrampNota>();

interface PaymentIdProps {
  paymentId: string;
  date: string;
}

function PaymentId({ paymentId, date }: PaymentIdProps) {
  return (
    <Link
      fontWeight={600}
      fontSize={"lg"}
      href={`/payments/${paymentId}`}
      pb={3}
      as={NextLink}
    >
      {date}
    </Link>
  );
}

interface UserIdProps {
  userId: string;
}

function UserId({ userId }: UserIdProps) {
  return (
    <Link
      fontWeight={600}
      fontSize={"lg"}
      href={`/users/${userId}`}
      as={NextLink}
      pb={3}
    >
      {userId}
    </Link>
  );
}

function MyNotas() {
  const { onrampNotas: data } = useOnrampNota();

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        cell: (info) => (
          <PaymentId
            paymentId={info.row.original.paymentId}
            date={info.getValue()}
          />
        ),
        header: "Timestamp",
      }),
      columnHelper.accessor("userId", {
        cell: (info) => {
          return <UserId userId={info.getValue()} />;
        },
        header: "User ID",
      }),
      columnHelper.accessor("amount", {
        cell: (info) => info.getValue() + " USDC",
        header: "Amount",
      }),
      columnHelper.accessor("riskScore", {
        cell: (info) => info.getValue(),
        header: "Risk score",
      }),
      columnHelper.accessor("paymentStatus", {
        cell: (info) => info.getValue(),
        header: "Payment status",
      }),
      columnHelper.accessor("riskFee", {
        cell: (info) => (
          <PaymentActions
            status={info.row.original.paymentStatus}
            paymentId={info.row.original.paymentId}
            style="small"
          />
        ),
        header: "Actions",
      }),
    ],
    []
  );

  if (!data || data.length === 0) {
    return <></>;
  }
  return (
    <VStack
      width="95%" // Changed for demo
      p={6}
      borderRadius="30px"
      gap={6}
      align="stretch"
      bg="brand.100"
    >
      <DataTable columns={columns} data={data} />{" "}
    </VStack>
  );
}

export default MyNotas;
