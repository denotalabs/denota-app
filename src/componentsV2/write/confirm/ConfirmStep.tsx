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

            const cheqId = await blockchainState.selfSignBroker?.writeCheq(
              tokenAddress,
              amountWei,
              escrowedWei,
              formData.address,
              formData.inspection
            );
            alert("Cheq created!: #" + cheqId);
            onClose?.();
          } else {
            onClose?.();
          }
        }}
      >
        {() => (
          <Form>
            <ConfirmNotice isInvoice={isInvoice}></ConfirmNotice>
            <ConfirmDetails></ConfirmDetails>
            <RoundedButton type="submit">
              {isInvoice ? "Create Invoice" : "Confirm Payment"}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqConfirmStep;
