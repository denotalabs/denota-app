import { Flex } from "@chakra-ui/react";
import HomeScreen from "../../components/dashboard/HomeScreen";

function DashboardPage() {
  return (
    <Flex w="100%" flex="1" justifyContent="center" alignItems="flex-start">
      <HomeScreen />
    </Flex>
  );
}

export default DashboardPage;
