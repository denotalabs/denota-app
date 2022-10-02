import { Form, Formik } from "formik";

import { Box, Button, Flex, Stack, Skeleton } from "@chakra-ui/react";

import RadioButtonField from "./RadioButtonField";
import AccountField from "./input/AccountField";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useHandshakes } from "../hooks/useHandshakes";

function UsersTab() {
  const blockchainState = useBlockchainData();
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
    let auditorsUsers: any = handshakeData.map((user: any, index: number) => (
      <li key={index}>{user}</li>
    ));
    if (auditorsUsers == false) {
      auditorsUsers = <li key={0}>Accept a user below</li>;
    }
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
      </div>
    );
  }
}

export default UsersTab;
