import { ethers } from "ethers";

import { Form, Formik } from "formik";

import { Button, Flex, FormLabel, Stack } from "@chakra-ui/react";

import type { BlockchainData } from "../hooks/useBlockchainData";
import TokenField from "./input/TokenField";
import AmountField from "./input/AmountField";
import AccountField from "./input/AccountField";
import DurationField from "./input/DurationField";

interface Props {
  blockchainState: BlockchainData;
}

function WriteTab({ blockchainState }: Props) {
  return (
    <Formik
      initialValues={{
        token: "dai",
        amount: 0,
        reviewer: "",
        bearer: "",
        duration: 0,
      }}
      onSubmit={(values, actions) => {
        if (
          blockchainState.cheq !== null &&
          blockchainState.dai !== null &&
          blockchainState.weth !== null
        ) {
          const token =
            values.token == "dai" ? blockchainState.dai : blockchainState.weth;
          // console.log(amount, duration, reviewer, bearer)
          const amountWei = ethers.utils.parseEther(values.amount.toString());
          console.log(amountWei, typeof amountWei);
          blockchainState.cheq?.functions[
            "writeCheque(address,uint256,uint256,address,address)"
          ](token, amountWei, values.duration, values.reviewer, values.bearer);
        }
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          actions.setSubmitting(false);
        }, 1000);
      }}
    >
      {(props) => (
        <Form>
          <Stack align="flex-start">
            <FormLabel>
              Please enter the recipient and the auditor addresses.
            </FormLabel>
            <Flex gap={10}>
              <AccountField
                fieldName="bearer"
                placeholder="Receiving Account address"
              />
              <AccountField
                fieldName="reviewer"
                placeholder="Reviewing Account address"
              />
            </Flex>
            <FormLabel>How much time until your cheq expires? </FormLabel>
            <DurationField />
            <FormLabel>How much would you like to send? </FormLabel>
            <Flex gap={10}>
              <TokenField />
              <AmountField />
            </Flex>
            <Button mt={4} isLoading={props.isSubmitting} type="submit">
              Send Cheq
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  );
}

export default WriteTab;
