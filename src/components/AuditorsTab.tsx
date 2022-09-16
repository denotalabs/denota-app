import { ethers } from "ethers";

import { Form, Formik } from "formik";

import { Button, Flex } from "@chakra-ui/react";

import type { BlockchainData } from "../hooks/useBlockchainData";
import AccountField from "./input/AccountField";
import RadioButtonField from "./input/RadioButtonField";

interface Props {
  blockchainState: BlockchainData;
}

function AuditorsTab({ blockchainState }: Props) {
  const userAuditors = blockchainState.acceptedUserAuditors.map((auditor) => (
    <li key={auditor}>{auditor.slice(2, 10)}...</li>
  ));
  const auditorUsers = blockchainState.acceptedAuditorUsers.map((user) => (
    <li key={user}>{user.slice(2, 10)}...</li>
  ));

  return (
    <>
      <Formik
        initialValues={{ address: "", accountType: "user" }}
        onSubmit={(values, actions) => {
          if (values.accountType === "user") {
            // user accepts this auditor
            blockchainState.cheq?.acceptAuditor(values.address);
          } else {
            // auditor accepts this user
            blockchainState.cheq?.acceptUser(values.address);
            blockchainState.cheq?.setAllowedDuration(60 * 60 * 24 * 7);
          }
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2));
            actions.setSubmitting(false);
          }, 1000);
        }}
      >
        {(props) => (
          <Form>
            <RadioButtonField
              fieldName="accountType"
              label="Are you a User or an Auditor?"
              values={["user", "auditor"]}
            />
            <br />
            <Flex gap={10} width={400}>
              <AccountField fieldName="address" placeholder="Address..." />
            </Flex>
            <Button mt={4} isLoading={props.isSubmitting} type="submit">
              Add Address
            </Button>
          </Form>
        )}
      </Formik>
      <br></br>
      Your Auditors: {userAuditors}
      <br></br>
      Your Users: {auditorUsers}
    </>
  );
}

export default AuditorsTab;
