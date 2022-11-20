import { Box, Button, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { Form, Formik } from "formik";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useStep } from "../../stepper/Stepper";
import RoundedButton from "../RoundedButton";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqConfirmStep({ isInvoice }: Props) {
  const { onClose, formData } = useStep();
  const blockchainState = useBlockchainData();

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{}}
        onSubmit={async () => {
          console.log({ formData });
          if (formData.module === "self") {
            let tokenAddress = "";

            switch (formData.token) {
              case "ETH":
                tokenAddress = blockchainState.weth?.address ?? "";
                break;
              case "WBTC":
                tokenAddress = blockchainState.weth?.address ?? "";
                break;
              case "USDC":
                tokenAddress = blockchainState.weth?.address ?? "";
                break;
            }

            const amountWei = ethers.utils.parseEther(formData.amount);

            const escrowedWei = formData.mode === "invoice" ? 0 : amountWei;

            try {
              const tx = await blockchainState.selfSignBroker?.writeCheq(
                tokenAddress,
                amountWei,
                escrowedWei,
                formData.address,
                formData.inspection
              );
              console.log(tx.hash);
              alert("TX hash " + tx.hash);
            } catch (error) {
              console.log(error);
              alert("Transaction failed");
            } finally {
              onClose?.();
            }
          } else {
            onClose?.();
          }
        }}
      >
        {(props) => (
          <Form>
            <ConfirmNotice isInvoice={isInvoice}></ConfirmNotice>
            <ConfirmDetails></ConfirmDetails>
            <RoundedButton type="submit" isLoading={props.isSubmitting}>
              {isInvoice ? "Create Invoice" : "Confirm Payment"}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqConfirmStep;
