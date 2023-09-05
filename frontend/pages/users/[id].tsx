import { Center, Stack, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import DetailsRow from "../../components/designSystem/DetailsRow";
import DetailsBox from "../../components/onramps/DetailsBox";

function UserPage() {
  const router = useRouter();
  const id: string = router.query.id as string;

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
            User {id}
          </Text>
          <DetailsBox>
            <DetailsRow title="UserId" value={id} />
          </DetailsBox>
        </VStack>
      </Center>
    </Stack>
  );
}

export default UserPage;
