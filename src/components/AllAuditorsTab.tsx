import { Form, Formik } from "formik";

import { Box, Button, Flex, Stack, Skeleton } from "@chakra-ui/react";

import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";
import { useUsers } from "../hooks/useUsers";

function AllAuditorsTab() {
  const blockchainState = useBlockchainData();
  const allAuditors = useUsers(false);

  if (!allAuditors) {
    return (
      <>
        <Stack>
          <Skeleton height="80px" />
        </Stack>
      </>
    );
  } else {
    const allAuditorsTag = allAuditors.length ? (
      allAuditors.map((account: any, index: number) => (
        <li
          key={index}
          onClick={() => {
            blockchainState.cheq?.acceptAuditor(account, true);
          }}
        >
          {account}
        </li>
      ))
    ) : (
      <li>No Auditors Available</li>
    );
    return (
      <div>
        <Box
          key={1}
          p={6}
          maxW={"460px"}
          w={"full"}
          boxShadow="sm"
          rounded={"lg"}
          borderWidth="1px"
          borderRadius="lg"
          zIndex={1}
        >
          {allAuditorsTag}
        </Box>
      </div>
    );
  }
}

export default AllAuditorsTab;
