import { Center, Stack, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import DetailsRow from "../../components/designSystem/DetailsRow";
import DetailsBox from "../../components/onramps/DetailsBox";
import { PaymentActions } from "../../components/onramps/PaymentActions";
import { useNotas } from "../../context/NotaDataProvider";
import { useFormatAddress } from "../../hooks/useFormatAddress";

function PaymentPage() {
  const router = useRouter();
  const id: string = router.query.id as string;
  const { notas: onrampNotas } = useNotas();
  const data = onrampNotas.find((nota) => nota.paymentId === id);

  const { formatAddress } = useFormatAddress();

  if (!data) {
    return <></>;
  }

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
              value={`${data.paymentAmount * 1.02} USD`}
            />
            <DetailsRow title="Fiat Payment Method" value="ACH" />
            <DetailsRow
              title="Crypto amount"
              value={`${data.paymentAmount} USDC`}
            />
            <DetailsRow title="Status" value={data.recoveryStatus} />
            <DetailsRow
              title="Coverage TX"
              value={formatAddress(data.mintTx)}
              link={`https://polygonscan.com/tx/${data.mintTx}`}
            />
          </DetailsBox>
          <PaymentActions
            status={data.recoveryStatus}
            paymentId={data.onchainId}
            paymentAmount={data.paymentAmount}
            style="big"
          />
        </VStack>
      </Center>
    </Stack>
  );
}

export default PaymentPage;
