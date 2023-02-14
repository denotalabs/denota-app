import { Center, Stack } from "@chakra-ui/react";
import HomeScreen from "../components/dashboard/HomeScreen";

function HomePage() {
  return (
    <>
      <Center my={2}>
        <Stack width="100%">
          <Center>
            <HomeScreen />
          </Center>
        </Stack>
      </Center>
    </>
  );
}

export default HomePage;
