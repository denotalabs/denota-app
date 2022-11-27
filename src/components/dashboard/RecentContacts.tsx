import { Box, Center, Text } from "@chakra-ui/react";

function RecentContacts() {
  // TODO (Integrate v2 UI with v2 smart contract): Load recent contacts from graph
  return (
    <Box bg="cadetblue" height={400} width="100%">
      <Center>
        <Text fontWeight={400} fontSize={"2xl"}>
          Recent Contacts
        </Text>
      </Center>
    </Box>
  );
}

export default RecentContacts;
