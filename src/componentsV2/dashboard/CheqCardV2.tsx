import { Button, ButtonGroup, GridItem, Text } from "@chakra-ui/react";

interface Props {
  sender: string;
  status: string;
  token: string;
  amount: string;
}

const colorForStatus = (status: string) => {
  switch (status) {
    case "cashed":
      return "blue.900";
    case "cashable":
      return "green.900";
    case "voided":
      return "gray.600";
    case "pending":
      return "purple.900";
    default:
      return "gray.600";
  }
};

function CheqCardV2({ sender, amount, token, status }: Props) {
  return (
    <GridItem
      w="100%"
      h="210"
      bg={colorForStatus(status)}
      p={2}
      borderRadius={"10px"}
    >
      <Text fontWeight={600} fontSize={"xl"}>
        Sender: {sender}
      </Text>
      <Text fontWeight={400} fontSize={"xl"}>
        Amount: {amount} {token}
      </Text>
      <Text fontWeight={400} fontSize={"xl"}>
        Status: {status}
      </Text>
      <ButtonGroup gap="4">
        <Button colorScheme="green">Cash</Button>
        <Button colorScheme="red">Cancel</Button>
      </ButtonGroup>
    </GridItem>
  );
}

export default CheqCardV2;
