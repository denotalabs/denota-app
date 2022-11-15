import { Button, ButtonGroup, GridItem, Text } from "@chakra-ui/react";

interface Props {
  sender: string;
  status: string;
  token: string;
  amount: string;
}

function CheqCardV2({ sender, amount, token, status }: Props) {
  return (
    <GridItem w="100%" h="210" bg="blue.500" p={2} borderRadius={"10px"}>
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
