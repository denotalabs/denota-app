import { Box, Center, Button, Text, Stack } from "@chakra-ui/react";
import {
  DaiAddress,
  useBlockchainData,
} from "../../context/BlockchainDataProvider";

interface Props {
  cheqId: number;
  expiry: string;
  status: string;
  token: string;
  amount: string;
  sender: string;
  auditor: string;
  created: string;
  isCashable: Boolean;
  isUser: boolean;
}

export default function CheqCard({
  cheqId,
  expiry,
  status,
  token,
  amount,
  sender,
  auditor,
  created,
  isCashable,
  isUser,
}: Props) {
  const blockchainState = useBlockchainData();

  let button;
  if (isUser) {
    if (status == "Cashed") {
      button = <Button disabled>Cashed</Button>;
    } else {
      button = isCashable ? (
        <Button
          onClick={(e) => {
            blockchainState.cheq?.cashCheque(cheqId);
          }}
        >
          Cash Cheq
        </Button>
      ) : (
        <Button
          onClick={(e) => {
            alert("Auditor has been notified");
          }}
          className=""
        >
          Cancel Cheq
        </Button>
      );
      status = isCashable ? "Matured" : status;
    }
  } else {
    if (!isCashable) {
      button = (
        <Button
          onClick={(e) => {
            blockchainState.cheq?.voidCheque(cheqId);
          }}
        >
          Void Cheq
        </Button>
      );
    } else {
      button = <Button disabled>Matured</Button>;
    }
  }

  return (
    <Center py={2}>
      <Box
        p={6}
        maxW={"330px"}
        w={"full"}
        boxShadow="sm"
        rounded={"lg"}
        borderWidth="1px"
        borderRadius="lg"
        zIndex={1}
      >
        <Stack>
          <Stack align={"flex-end"}>
            <Text fontWeight={600} fontSize={"md"}>
              Sender: {sender}
            </Text>
            <Text fontWeight={400} fontSize={"xs"}>
              Amount: {amount} {token}
            </Text>
            <Text fontWeight={400} fontSize={"xs"}>
              Auditor: {auditor}
            </Text>
            <Text fontWeight={400} fontSize={"xs"}>
              Created: {created}
            </Text>
            <Text fontWeight={400} fontSize={"xs"}>
              Maturation: {expiry}
            </Text>
            <Text fontWeight={400} fontSize={"xs"}>
              Status: {status}
            </Text>
            <Text
              color={"gray.500"}
              fontSize={"sm"}
              textTransform={"uppercase"}
            >
              Cheque ID: {cheqId}
            </Text>
          </Stack>
        </Stack>
        {button}
      </Box>
    </Center>
  );
}
