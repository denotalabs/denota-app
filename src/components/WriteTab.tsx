import { BigNumber, ethers } from "ethers";

import { Field, Form, Formik } from "formik";

import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Stack,
} from "@chakra-ui/react";

import TokenField from "./input/TokenField";
import AmountField from "./input/AmountField";
import AccountField from "./input/AccountField";
import DurationField from "./input/DurationField";
import AuditorField from "./input/AuditorField";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useHandshakes } from "../hooks/useHandshakes";

function WriteTab() {
  const blockchainState = useBlockchainData();
  const handshakeData = useHandshakes(true);
  // let auditorSelect: any = <AuditorField/>// blockchainState={blockchainState} handshakeData={handshakeData} />

  return (
    <Formik
      initialValues={{
        token: "dai",
        amount: 0,
        reviewer: "",
        bearer: "",
        duration: 60,
      }}
      onSubmit={(values, actions) => {
        if (
          blockchainState.cheq !== null &&
          blockchainState.account !== "" &&
          blockchainState.dai !== null &&
          blockchainState.weth !== null
        ) {
          const token =
            values.token == "dai" ? blockchainState.dai : blockchainState.weth;
          const amountWei = ethers.utils.parseEther(values.amount.toString());

          console.log(values);

          token.functions
            .allowance(blockchainState.account, blockchainState.cheqAddress) // Get user's token approval granted to Cheq
            .then((tokenAllowance) => {
              if (amountWei.sub(tokenAllowance[0]) > BigNumber.from(0)) {
                // User has not approved Cheq enough allowance
                token.functions
                  .approve(blockchainState.cheqAddress, amountWei)
                  .then((success) => {
                    if (success) {
                      blockchainState.cheq?.depositWrite(
                        token.address,
                        amountWei,
                        values.duration,
                        values.reviewer,
                        values.bearer
                      );
                    } else {
                      alert("Token approval failed");
                    }
                  });
              } else {
                blockchainState.cheq
                  ?.depositWrite(
                    token.address,
                    amountWei,
                    values.duration,
                    values.reviewer,
                    values.bearer
                  )
                  .then((cheqID: string) => {
                    console.log(cheqID);
                    alert("Cheq created!: #" + cheqID);
                  });
              }
            });
        }
        setTimeout(() => {
          actions.setSubmitting(false);
        }, 2000);
      }}
    >
      {(props) => (
        <Form>
          <Stack align="flex-start">
            <FormLabel>Merchant Address</FormLabel>
            <Flex gap={10}>
              <AccountField fieldName="bearer" placeholder="0x" />
            </Flex>

            <FormLabel>Auditor Address</FormLabel>
            <Flex gap={10}>
              <AuditorField fieldName="reviewer" placeholder="Select Auditor" />
            </Flex>

            <FormLabel>Inspection Period:</FormLabel>
            <Flex gap={10}>
              <DurationField />
            </Flex>

            <FormLabel>Select Currency</FormLabel>
            <Flex gap={10}>
              <TokenField />
            </Flex>

            <FormLabel>Amount</FormLabel>
            <Flex gap={10}>
              <AmountField />
            </Flex>

            <Flex gap={10}>
              <Button mt={4} isLoading={props.isSubmitting} type="submit">
                Send Cheq
              </Button>
            </Flex>
          </Stack>
        </Form>
      )}
    </Formik>
  );
}

export default WriteTab;
