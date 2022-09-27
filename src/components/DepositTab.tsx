import { ethers } from "ethers";

import { Form, Formik } from "formik";

import { Button, Flex, FormLabel } from "@chakra-ui/react";

import TokenField from "./input/TokenField";
import AmountField from "./input/AmountField";
import { useBlockchainData } from "../context/BlockchainDataProvider";

function DepositTab() {
  const blockchainState = useBlockchainData();

  return (
    <Formik
      initialValues={{ token: "dai", amount: 0 }}
      onSubmit={(values, actions) => {
        const weiAmount = ethers.utils.parseEther(values.amount.toString()); // convert to wei
        if (
          blockchainState.cheq !== null &&
          blockchainState.dai !== null &&
          blockchainState.weth !== null
        ) {
          const depositToken = // Token Contract
            values.token == "dai" ? blockchainState.dai : blockchainState.weth;

          console.log(blockchainState.daiAllowance.toString());
          console.log(depositToken, weiAmount);
          console.log(weiAmount, weiAmount.lte(blockchainState.daiAllowance));

          if (weiAmount.lte(blockchainState.daiAllowance)) {
            blockchainState.cheq.functions["deposit(address,uint256)"](
              depositToken.address,
              weiAmount
            ).then((message) => {
              alert(message);
            });
          } else {
            depositToken.approve(blockchainState.cheqAddress, weiAmount);
            // alert(values);
          }
          // console.log(depositToken, weiAmount);
          // console.log('blockchainState');
        }
        // setTimeout(() => {
        //   alert(JSON.stringify(values, null, 2));
        //   actions.setSubmitting(false);
        // }, 1000);
      }}
    >
      {(props) => (
        <Form>
          <FormLabel>
            How much do you want to deposit? <br></br>
            Your Dai Balance: {blockchainState.userDaiBalance}
            <br></br>
            Your Weth Balance: {blockchainState.userWethBalance}
          </FormLabel>
          <Flex gap={10}>
            <TokenField />
            <AmountField />
          </Flex>
          <Button mt={4} isLoading={props.isSubmitting} type="submit">
            Deposit
          </Button>
        </Form>
      )}
    </Formik>
  );
}

export default DepositTab;
