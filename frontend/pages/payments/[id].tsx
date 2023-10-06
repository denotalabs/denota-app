import { Center, Stack, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useMemo } from "react";
import DetailsRow from "../../components/designSystem/DetailsRow";
import DetailsBox from "../../components/onramps/DetailsBox";
import { PaymentActions } from "../../components/onramps/PaymentActions";
import { useNotas } from "../../context/OnrampDataProvider";

function PaymentPage() {
  const router = useRouter();
  const id: string = router.query.id as string;
  const { notas: onrampNotas } = useNotas();
  const data = onrampNotas.find((nota) => nota.paymentId === id);

  const shouldShowWithdrawalTx = useMemo(() => {
    switch (data.recoveryStatus) {
      case "Clawed Back":
      case "Released":
      case "Withdrawn":
        return true;
    }
    return false;
  }, [data.recoveryStatus]);

  const shouldShowReleaseTx = useMemo(() => {
    switch (data.recoveryStatus) {
      case "Released":
        return true;
    }
    return false;
  }, [data.recoveryStatus]);

  const shouldShowClawBackTx = useMemo(() => {
    switch (data.recoveryStatus) {
      case "Clawed Back":
        return true;
    }
    return false;
  }, [data.recoveryStatus]);

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
            <DetailsRow title="Timestamp" value={data.createdAt} />
            <DetailsRow title="UserId" value={data.userId} />
            <DetailsRow
              title="Fiat amount"
              value={String(data.paymentAmount * 1.02) + " USD"}
            />
            <DetailsRow title="Fiat Payment Method" value="ACH" />
            <DetailsRow
              title="Crypto amount"
              value={String(data.paymentAmount) + " USDC"}
            />
            <DetailsRow title="Status" value={data.recoveryStatus} />
            <DetailsRow title="Risk Score" value={String(data.riskScore)} />
            <DetailsRow title="Covered By Denota?" value="Yes" />
            <DetailsRow title="Risk Fee" value={"[TODO] USDC"} />
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
            status={data.recoveryStatus}
            paymentId={id}
            style="big"
          />
        </VStack>
      </Center>
    </Stack>
  );
}

export default PaymentPage;
