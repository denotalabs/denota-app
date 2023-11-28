import { Button, Center, Link, Text, VStack } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { MdOutlineAdd } from "react-icons/md";
import { Nota, useNotas } from "../../context/NotaDataProvider";
import { DataTable } from "./table/NotaTable";

const columnHelper = createColumnHelper<Nota>();

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
  const { notas: data } = useNotas();
  const router = useRouter();

  const columns = useMemo(
    () => [
      columnHelper.accessor("createdAt", {
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
      columnHelper.accessor("paymentAmount", {
        cell: (info) => info.getValue() + " USDC",
        header: "Amount",
      }),
      columnHelper.accessor("recoveryStatus", {
        cell: (info) => info.getValue(),
        header: "Payment status",
      }),
    ],
    []
  );

  if (!data) {
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
      {data.length === 0 ? (
        <Center flexDirection={"column"}>
          <Text fontSize={"xl"} py={3}>
            {" "}
            No notas found
          </Text>
          <Text fontWeight={600} fontSize={"xl"} textAlign="center" pb={6}>
            <Button
              bg="notaPurple.100"
              w="min(40vw, 200px)"
              onClick={() => {
                router.push("/send", undefined, { shallow: true });
              }}
              fontSize="2xl"
              size="lg"
              borderRadius={5}
              leftIcon={<MdOutlineAdd />}
            >
              New Nota
            </Button>{" "}
          </Text>
        </Center>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </VStack>
  );
}

export default MyNotas;
