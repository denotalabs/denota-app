import {
  Button,
  ButtonGroup,
  Center,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import DetailsRow from "../../components/designSystem/DetailsRow";
import InfoBox from "../../components/onramps/InfoBox";

interface FakePayment {
  timestamp: string;
  userId: string;
  amount: string;
  status: string;
  riskScore: string;
  factoredAmount: string;
  humaPool: string;
  withdrawalTx: string;
}

const fakeData: { [key: string]: FakePayment } = {
  "1": {
    timestamp: "2023-06-31 21:59:59",
    userId: "111231",
    amount: "100 USDC",
    status: "Pending",
    riskScore: "50",
    factoredAmount: "97.5 USDC",
    humaPool: "123",
    withdrawalTx: "0x123...456",
  },
  "2": {
    timestamp: "2023-07-10 11:34:39",
    userId: "212211",
    amount: "150 USDC",
    status: "Pending",
    riskScore: "25",
    factoredAmount: "147.5 USDC",
    humaPool: "123",
    withdrawalTx: "0x123...456",
  },
  "3": {
    timestamp: "2023-07-08 13:16:29",
    userId: "122112",
    amount: "175 USDC",
    status: "Pending",
    riskScore: "35",
    factoredAmount: "170.0 USDC",
    humaPool: "123",
    withdrawalTx: "0x123...456",
  },
  "4": {
    timestamp: "2023-07-04 12:08:19",
    userId: "111122",
    amount: "275 USDC",
    status: "Requested",
    riskScore: "35",
    factoredAmount: "270.0 USDC",
    humaPool: "123",
    withdrawalTx: "0x123...456",
  },
};

function PaymentPage() {
  const router = useRouter();
  const id: string = router.query.id as string;
  const data = fakeData[id];
  return (
    <Stack width="100%">
      <Center>
        <VStack
          width="100%"
          bg="brand.100"
          maxW="750px"
          py={5}
          borderRadius="30px"
          gap={4}
        >
          <Text fontSize="2xl" fontWeight={600}>
            Payment # {id}
          </Text>
          <InfoBox>
            <DetailsRow title="Timestamp" value={data.timestamp} />
            <DetailsRow title="UserId" value={data.userId} />
            <DetailsRow title="Amount" value={data.amount} />
            <DetailsRow title="Status" value={data.status} />
            <DetailsRow title="Risk Score" value={data.riskScore} />
            <DetailsRow title="Factored Amount" value={data.factoredAmount} />
            <DetailsRow
              title="Huma Pool ID"
              value={data.humaPool}
              link="https://google.com"
            />
            <DetailsRow
              title="Withdrawal TX"
              value={data.withdrawalTx}
              link="https://google.com"
            />
          </InfoBox>
          <PaymentActions status={data.status} />
        </VStack>
      </Center>
    </Stack>
  );
}

interface ActionsProp {
  status: string;
}

function PaymentActions({ status }: ActionsProp) {
  switch (status) {
    case "Pending":
      return (
        <ButtonGroup>
          <Button fontSize="2xl" w="min(40vw, 200px)" borderRadius={5}>
            Clawback
          </Button>
          <Button fontSize="2xl" w="min(40vw, 200px)" borderRadius={5}>
            Release
          </Button>
        </ButtonGroup>
      );
    case "Requested":
      return (
        <Button fontSize="2xl" w="min(40vw, 200px)" borderRadius={5}>
          Approve
        </Button>
      );
  }
}

export default PaymentPage;
