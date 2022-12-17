import { Form, Formik } from "formik";

import { Box, Button, Flex, Stack, Skeleton } from "@chakra-ui/react";

import RadioButtonField from "./RadioButtonField";
import AccountField from "./input/AccountField";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useHandshakes } from "../../hooks/useHandshakes";

function UsersTab() {
  const { blockchainState } = useBlockchainData();
  const handshakeData = useHandshakes(false);

  if (!handshakeData) {
    return (
      <>
        <Stack>
          <Skeleton height="80px" />
        </Stack>
      </>
    );
  } else {
    let auditorsUsers: any = handshakeData["completed"].map(
      (user: any, index: number) => {
        if (user) {
          return <li key={index}>{user}</li>;
        }
      }
    );
    auditorsUsers = auditorsUsers.length ? (
      auditorsUsers
    ) : (
      <li key={0}>Accept a user below</li>
    );

    let auditorsRequested = handshakeData["requested"].map(
      (user: any, index: number) => <li key={index}>{user}</li>
    );
    auditorsRequested = auditorsRequested.length ? (
      auditorsRequested
    ) : (
      <li key={0}>Not Waiting On Any Users' Approval</li>
    );

    return (
      <div>
        <br></br>
        Your current users:
        <br></br>
        <br></br>
        <Box
          key={1}
          p={6}
          maxW={"455px"}
          w={"full"}
          boxShadow="sm"
          rounded={"lg"}
          borderWidth="1px"
          borderRadius="lg"
          zIndex={1}
        >
          {auditorsUsers}
        </Box>
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
        <br></br>
        Your requested users:
        <br></br>
        <br></br>
        <Box
          key={2}
          p={6}
          maxW={"455px"}
          w={"full"}
          boxShadow="sm"
          rounded={"lg"}
          borderWidth="1px"
          borderRadius="lg"
          zIndex={1}
        >
          {auditorsRequested}
        </Box>
      </div>
    );
  }
}

export default UsersTab;