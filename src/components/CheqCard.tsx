import { Box, Center, Button, Text, Stack } from "@chakra-ui/react";
import { ethers } from "ethers";
import {
  DaiAddress,
  useBlockchainData,
} from "../context/BlockchainDataProvider";

interface Props {
  cheqArrayState: any;
}

// id, recipient, amount, status, timestamp, token, expiry
export default function CheqCard({ cheqArrayState }: Props) {
  const blockchainState = useBlockchainData();

  const cheqId = cheqArrayState[0];
  let status =
    cheqArrayState[1].status == 0
      ? "Pending"
      : cheqArrayState[1].status == 1
      ? "Cashed"
      : "Voided";
  const token = cheqArrayState[1].token === DaiAddress ? "DAI" : "WETH";
  const amount = ethers.utils
    .formatEther(cheqArrayState[1].amount.toString())
    .toString();
  const sender = cheqArrayState[1].drawer.slice(0, 10) + "...";
  const auditor = cheqArrayState[1].auditor.slice(0, 10) + "...";
  const created = cheqArrayState[2].toLocaleString("en-US", {
    timeZone: "UTC",
  });
  const timeCreated = new Date(cheqArrayState[1].expiry * 1000);
  const expiration = timeCreated.toLocaleString("en-US", { timeZone: "UTC" });
  const isCashable = Date.now() >= cheqArrayState[1].expiry.toNumber() * 1000;

  let button;
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
    status = isCashable ? "Mature" : status;
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
              Maturation: {expiration}
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
