import { Form, Formik } from "formik";

import { Box, Button, Flex, Stack, Skeleton } from "@chakra-ui/react";

import RadioButtonField from "./RadioButtonField";
import AccountField from "./input/AccountField";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useAccount } from "../hooks/useAccount";

function AuditorsTab() {
  const blockchainState = useBlockchainData();
  const accountData = useAccount();

  if (!accountData) {
    return (
      <>
        <Stack>
          <Skeleton height="80px" />
        </Stack>
      </>
    );
  } else {
    const requestedAuditors = accountData["auditorsRequested"];
    let userAuditors: any = requestedAuditors.map(
      (auditor: any, index: number) => (
        <Box
          key={index.toString()}
          p={6}
          maxW={"455px"}
          w={"full"}
          boxShadow="sm"
          rounded={"lg"}
          borderWidth="1px"
          borderRadius="lg"
          zIndex={1}
        >
          {auditor["auditorAddress"]["id"]}
        </Box>
      )
    );
    return (
      <div>
        <br></br>
        Your Pending Auditors:
        <br></br>
        <br></br>
        {userAuditors}
        <br></br>
        <Formik
          initialValues={{ address: "", accountType: "add" }}
          onSubmit={(values, actions) => {
            let bool = true ? values.accountType === "add" : false;
            blockchainState.cheq?.acceptAuditor(values.address, bool);
          }}
        >
          {(props) => (
            <Form>
              <RadioButtonField
                fieldName="accountType"
                label="Add or remove auditor?"
                values={["add", "remove"]}
              />
              <br />
              <Flex gap={10} width={400}>
                <AccountField fieldName="address" placeholder="Address..." />
              </Flex>
              <Button mt={4} isLoading={props.isSubmitting} type="submit">
                Update
              </Button>
            </Form>
          )}
        </Formik>
        <br></br>
        <Formik
          initialValues={{ address: "", accountType: "add" }}
          onSubmit={(values, actions) => {
            if (values.accountType === "add") {
              blockchainState.cheq?.acceptUser(values.address, true);
            } else {
              blockchainState.cheq?.acceptUser(values.address, false);
            }
          }}
        >
          {(props) => (
            <Form>
              <RadioButtonField
                fieldName="accountType"
                label="Add or remove user?"
                values={["add", "remove"]}
              />
              <br />
              <Flex gap={10} width={400}>
                <AccountField fieldName="address" placeholder="Address..." />
              </Flex>
              <Button mt={4} isLoading={props.isSubmitting} type="submit">
                Update
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    );
  }
}

export default AuditorsTab;
