import {
  Button,
  ButtonGroup,
  Center,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
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

const defaultFakePayment = {
  timestamp: "2023-06-31 21:59:59",
  userId: "111231",
  amount: "100 USDC",
  status: "Pending",
  riskScore: "50",
  factoredAmount: "97.5 USDC",
  humaPool: "123",
  withdrawalTx: "0x123...456",
};

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

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function PaymentPage() {
  const router = useRouter();
  const id: string = router.query.id as string;
  const data = fakeData[id] ? fakeData[id] : defaultFakePayment;
  const [updatedStatus, setUpdatedStatus] = useState("");
  const updateStatus = useCallback(() => {
    const cookieStatus = Cookies.get(`payments-${id}`);

    if (!cookieStatus) {
      setUpdatedStatus(data.status);
    }
    switch (cookieStatus) {
      case "clawed-back":
        setUpdatedStatus("Clawed Back");
        break;
      case "released":
        setUpdatedStatus("Released");
        break;
      case "approved":
        setUpdatedStatus("Pending");
        break;
    }
  }, [data.status, id]);

  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

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
            <DetailsRow title="Status" value={updatedStatus} />
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
          <PaymentActions
            status={updatedStatus}
            paymentId={id}
            updateStatus={updateStatus}
          />
        </VStack>
      </Center>
    </Stack>
  );
}

interface ActionsProp {
  status: string;
  paymentId: string;
  updateStatus: () => void;
}

function PaymentActions({ status, paymentId, updateStatus }: ActionsProp) {
  const [clawbackLoading, setClawbackLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  switch (status) {
    case "Pending":
      return (
        <ButtonGroup>
          <Button
            fontSize="2xl"
            w="min(40vw, 200px)"
            borderRadius={5}
            isLoading={clawbackLoading}
            onClick={async () => {
              setClawbackLoading(true);
              await wait(3000);
              Cookies.set(`payments-${paymentId}`, "clawed-back");
              setClawbackLoading(false);
              updateStatus();
            }}
          >
            Clawback
          </Button>
          <Button
            fontSize="2xl"
            w="min(40vw, 200px)"
            borderRadius={5}
            isLoading={releaseLoading}
            onClick={async () => {
              setReleaseLoading(true);
              await wait(3000);
              Cookies.set(`payments-${paymentId}`, "released");
              setReleaseLoading(false);
              updateStatus();
            }}
          >
            Release
          </Button>
        </ButtonGroup>
      );
    case "Requested":
      return (
        <Button
          fontSize="2xl"
          w="min(40vw, 200px)"
          borderRadius={5}
          isLoading={approveLoading}
          onClick={async () => {
            setApproveLoading(true);
            await wait(3000);
            Cookies.set(`payments-${paymentId}`, "approved");
            setApproveLoading(false);
            updateStatus();
          }}
        >
          Approve
        </Button>
      );
  }
}

export default PaymentPage;
