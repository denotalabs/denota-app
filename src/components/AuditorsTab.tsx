import { Form, Formik } from "formik";

import { Box, Button, Flex } from "@chakra-ui/react";

import type { BlockchainData } from "../hooks/useBlockchainData";
import RadioButtonField from "./RadioButtonField";
import AccountField from "./input/AccountField";

interface Props {
  blockchainState: BlockchainData;
}

function AuditorsTab({ blockchainState }: Props) {
  const userAuditors = (
    <Box
      p={6}
      maxW={"455px"}
      w={"full"}
      boxShadow="sm"
      rounded={"lg"}
      borderWidth="1px"
      borderRadius="lg"
      zIndex={1}
    >
      0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
    </Box>
  );

  return (
    <div>
      <br></br>
      Available Auditors:
      <br></br>
      <br></br>
      {userAuditors}
      <br></br>
      <Formik
        initialValues={{ address: "", accountType: "add" }}
        onSubmit={(values, actions) => {
          if (values.accountType === "add") {
            // user accepts this auditor
            blockchainState.cheq?.acceptAuditor(values.address, true);
          } else {
            // auditor accepts this user
            blockchainState.cheq?.acceptAuditor(values.address, false);
          }
        }}
      >
        {(props) => (
          <Form>
            <RadioButtonField
              fieldName="accountType"
              label="Add or Remove Auditor?"
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
              label="Add or Remove User?"
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

export default AuditorsTab;
