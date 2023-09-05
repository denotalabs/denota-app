import { Center, Stack, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";
import DetailsRow from "../../components/designSystem/DetailsRow";
import DetailsBox from "../../components/onramps/DetailsBox";
import { PaymentActions } from "../../components/onramps/PaymentActions";
import { useOnrampNota } from "../../context/OnrampDataProvider";

const defaultFakePayment = {
  paymentId: "4",
  date: "2023-07-04 12:08:19",
  amount: 275,
  riskFee: 0.9625,
  userId: "111122",
  paymentStatus: "Requested",
  riskScore: 35,
};

function PaymentPage() {
  const router = useRouter();
  const id: string = router.query.id as string;
  const { onrampNotas } = useOnrampNota();
  const data =
    onrampNotas.find((nota) => nota.paymentId === id) ?? defaultFakePayment;

  const shouldShowWithdrawalTx = useMemo(() => {
    switch (data.paymentStatus) {
      case "Clawed Back":
      case "Released":
      case "Withdrawn":
        return true;
    }
    return false;
  }, [data.paymentStatus]);

  const shouldShowReleaseTx = useMemo(() => {
    switch (data.paymentStatus) {
      case "Released":
        return true;
    }
    return false;
  }, [data.paymentStatus]);

  const shouldShowClawBackTx = useMemo(() => {
    switch (data.paymentStatus) {
      case "Clawed Back":
        return true;
    }
    return false;
  }, [data.paymentStatus]);

  return (
    <Stack width="100%">
      <Center>
        <VStack
          width="100%"
          bg="brand.100"
          maxW="650px"
          py={5}
          borderRadius="30px"
          gap={4}
        >
          <Text fontSize="2xl" fontWeight={600}>
            Payment # {id}
          </Text>
          <DetailsBox>
            <DetailsRow title="Timestamp" value={data.date} />
            <DetailsRow title="UserId" value={data.userId} />
            <DetailsRow title="Amount" value={String(data.amount) + " USDC"} />
            <DetailsRow title="Status" value={data.paymentStatus} />
            <DetailsRow title="Risk Score" value={String(data.riskScore)} />
            <DetailsRow title="Covered By Denota?" value="Yes" />
            <DetailsRow
              title="Risk Fee"
              value={String(data.riskFee) + " USDC"}
            />
            {shouldShowWithdrawalTx && (
              <DetailsRow
                title="Withdrawal TX"
                value={"0x123...456"}
                link="https://google.com"
              />
            )}
            {shouldShowReleaseTx && (
              <DetailsRow
                title="Release TX"
                value={"0x987...345"}
                link="https://google.com"
              />
            )}
            {shouldShowClawBackTx && (
              <DetailsRow
                title="Clawback TX"
                value={"0x456...321"}
                link="https://google.com"
              />
            )}
          </DetailsBox>
          <PaymentActions
            status={data.paymentStatus}
            paymentId={id}
            style="big"
          />
        </VStack>
      </Center>
    </Stack>
  );
}

export default PaymentPage;
