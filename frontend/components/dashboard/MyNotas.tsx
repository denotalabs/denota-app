import { RepeatIcon } from "@chakra-ui/icons";
import {
  Button,
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
import Cookies from "js-cookie";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { MdOutlineAdd } from "react-icons/md";
import { useNotaContext } from "../../context/NotasContext";
import { useOnrampNota } from "../../context/OnrampDataProvider";
import useDemoMode from "../../hooks/useDemoMode";
import { Nota } from "../../hooks/useNotas";
import { PaymentActions } from "../onramps/PaymentActions";
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

const fakeData: TableNota[] = [
  {
    paymentId: "1",
    date: "2023-06-31 21:59:59",
    amount: 100,
    factor: 25.4,
    userId: "111231",
    paymentStatus: "Withdrawn",
    riskScore: 50,
  },
  {
    paymentId: "2",
    date: "2023-07-10 11:34:39",
    amount: 150,
    factor: 30.48,
    userId: "212211",
    paymentStatus: "Withdrawn",
    riskScore: 25,
  },
  {
    paymentId: "3",
    date: "2023-07-08 13:16:29",
    amount: 175,
    factor: 0.91444,
    userId: "122112",
    paymentStatus: "Withdrawn",
    riskScore: 35,
  },
  {
    paymentId: "4",
    date: "2023-07-04 12:08:19",
    amount: 275,
    factor: 0.91444,
    userId: "111122",
    paymentStatus: "Requested",
    riskScore: 35,
  },
];

const columnHelper = createColumnHelper<TableNota>();

const getUpdatedStatus = (originalStatus: string, paymentId: string) => {
  const cookieStatus = Cookies.get(`payments-${paymentId}`);

  if (!cookieStatus) {
    return originalStatus;
  }

  switch (cookieStatus) {
    case "clawed-back":
      return "Clawed Back";
    case "released":
      return "Released";
    case "approved":
      return "Withdrawn";
  }
};

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
  const isDemoMode = useDemoMode();

  const { notas, refresh, setNotaField, isLoading } = useNotaContext();

  // const [data, setData] = useState<TableNota[]>([]);
  const { onrampNotas: data } = useOnrampNota();

  const updateData = useCallback(() => {
    // setData(
    //   fakeData.map((entry) => ({
    //     ...entry,
    //     paymentStatus: getUpdatedStatus(entry.paymentStatus, entry.paymentId),
    //   }))
    // );
  }, []);

  // useEffect(() => {
  //   updateData();
  // }, [updateData]);

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
      columnHelper.accessor("factor", {
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

  if (isDemoMode) {
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
      <MyNotasGrid notas={isLoading ? undefined : notas} />
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
