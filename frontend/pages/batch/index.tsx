import { Center } from "@chakra-ui/react";
import type { NextPage } from "next";
import { BatchBridgeFlow } from "../../components/batchBridge/BatchBridgeFlow";

const BatchPage: NextPage = () => (
  <Center w="100%" h="100%">
    <BatchBridgeFlow />
  </Center>
);

export default BatchPage;
