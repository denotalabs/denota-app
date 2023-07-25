import { RepeatIcon } from "@chakra-ui/icons";
import {
  Button,
  ButtonGroup,
  Center,
  Grid,
  HStack,
  IconButton,
  Link,
  Select,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { MdOutlineAdd } from "react-icons/md";
import { useNotaContext } from "../../context/NotasContext";
import { Nota } from "../../hooks/useNotas";
import NotaCard from "./NotaCard";
import { DataTable } from "./table/NotaTable";

type TableNota = {
  paymentId: string;
  date: string;
  amount: number;
  factor: number;
  userId: string;
  paymentStatus: string;
  riskScore: number;
};

const data: TableNota[] = [
  {
    paymentId: "1",
    date: "7/10",
    amount: 100,
    factor: 25.4,
    userId: "111231",
    paymentStatus: "Pending",
    riskScore: 50,
  },
  {
    paymentId: "2",
    date: "8/1",
    amount: 150,
    factor: 30.48,
    userId: "212211",
    paymentStatus: "Pending",
    riskScore: 25,
  },
  {
    paymentId: "3",
    date: "9/13",
    amount: 175,
    factor: 0.91444,
    userId: "122112",
    paymentStatus: "Pending",
    riskScore: 35,
  },
];

const columnHelper = createColumnHelper<TableNota>();

const columns = [
  columnHelper.accessor("date", {
    cell: (info) => (
      <PaymentId
        paymentId={info.row.original.paymentId}
        date={info.getValue()}
      />
    ),
    header: "Date",
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
  columnHelper.accessor("factor", {
    cell: (info) => (
      <ButtonGroup flexWrap={"wrap"}>
        <Button
          variant="outline"
          w="min(40vw, 100px)"
          borderRadius={5}
          colorScheme="teal"
        >
          Clawback
        </Button>
        <Button
          variant="outline"
          w="min(40vw, 100px)"
          borderRadius={5}
          colorScheme="teal"
        >
          Release
        </Button>
      </ButtonGroup>
    ),
    header: "Actions",
    meta: {
      isNumeric: true,
    },
  }),
];

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
  const { notas, refresh, setNotaField, isLoading } = useNotaContext();

  return (
    <VStack
      width="95%" // Changed for demo
      p={6}
      borderRadius="30px"
      gap={6}
      align="stretch"
      bg="brand.100"
    >
      <HStack gap={2} justifyContent="space-between">
        <Select
          defaultValue={"all"}
          minW={0}
          w="120px"
          onChange={(event) => {
            setNotaField(event.target.value);
          }}
          focusBorderColor="clear"
        >
          <option value="all">All</option>
          <option value="cheqsReceived">Received</option>
          <option value="cheqsSent">Sent</option>
        </Select>
        <IconButton
          size="lg"
          aria-label="refresh"
          icon={<RepeatIcon />}
          onClick={refresh}
        />
      </HStack>
      <DataTable columns={columns} data={data} />

      {/* <MyNotasGrid notas={isLoading ? undefined : notas} /> */}
    </VStack>
  );
}

interface GridProps {
  notas: Nota[] | undefined;
}

function MyNotasGrid({ notas }: GridProps) {
  const router = useRouter();

  if (notas === undefined) {
    return (
      <Center flexDirection={"column"} w="100%" px={5}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (notas.length === 0) {
    return (
      <Center>
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
    );
  }

  return (
    <Grid
      templateColumns={[
        "repeat(auto-fit, minmax(240px, 1fr))",
        "repeat(auto-fit, minmax(240px, 1fr))",
        "repeat(auto-fit, minmax(240px, 1fr))",
        "repeat(3, 1fr)",
      ]}
      gap={6}
      bg={["transparent", "transparent", "brand.600"]}
      borderRadius="10px"
      p={{ md: "0", lg: "4" }}
    >
      {notas.map((nota) => {
        return <NotaCard key={nota.id} nota={nota} />;
      })}
    </Grid>
  );
}

export default MyNotas;
