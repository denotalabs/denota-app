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

function PaymentPage() {
  const router = useRouter();
  return (
    <Stack width="100%">
      <VStack gap={4}>
        <Center alignItems={"flex-start"} width="100%" maxWidth="80rem">
          <Text fontSize="2xl" fontWeight={600}>
            Payment # {router.query.id}
          </Text>
        </Center>
        <InfoBox>
          <DetailsRow title="Timestamp" value="2023-06-31 21:59:59" />
          <DetailsRow title="UserId" value="111231" />
          <DetailsRow title="Status" value="Pending" />
          <DetailsRow title="Risk Score" value="50" />
          <DetailsRow
            title="Huma Pool ID"
            value="123"
            link="https://google.com"
          />
          <DetailsRow
            title="Withdrawal TX"
            value="0x123...456"
            link="https://google.com"
          />
        </InfoBox>
        <ButtonGroup>
          <Button fontSize="2xl" w="min(40vw, 200px)" borderRadius={5}>
            Clawback
          </Button>
          <Button fontSize="2xl" w="min(40vw, 200px)" borderRadius={5}>
            Release
          </Button>
        </ButtonGroup>
      </VStack>
    </Stack>
  );
}

export default PaymentPage;
