import { Form, Formik } from "formik";

import { Box, Button, Flex, Stack, Skeleton } from "@chakra-ui/react";

import RadioButtonField from "./RadioButtonField";
import AccountField from "./input/AccountField";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useHandshakes } from "../hooks/useHandshakes";

function AuditorsTab() {
  const blockchainState = useBlockchainData();
  const handshakeData = useHandshakes(true);

  if (!handshakeData) {
    return (
      <>
        <Stack>
          <Skeleton height="80px" />
        </Stack>
      </>
    );
  } else {
    let userAuditors: any = handshakeData.map((auditor: any, index: number) => (
      <li key={index}>{auditor}</li>
    ));
    if (!userAuditors) {
      userAuditors = <li key={0}>Request an auditor below</li>;
    }
    return (
      <div>
        <br></br>
        Your current auditors:
        <br></br>
        <br></br>
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
          {userAuditors}
        </Box>
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
      </div>
    );
  }
}

export default AuditorsTab;
