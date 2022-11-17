import { Stack, Center } from "@chakra-ui/react";

import HomeScreen from "../componentsV2/dashboard/HomeScreen";

function HomePage() {
  return (
    <>
      <Center my={4} py={4}>
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
