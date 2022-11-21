import { Box, Button, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
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

  const [needsApproval, setNeedsApproval] = useState(formData.mode === "pay");

  const token =
    formData.token == "dai" ? blockchainState.dai : blockchainState.weth;

  const amountWei = ethers.utils.parseEther(formData.amount);

  const buttonText = useMemo(() => {
    if (needsApproval) {
      return "Approve " + formData.token;
    }
    return isInvoice ? "Create Invoice" : "Confirm Payment";
  }, [needsApproval]);

  useEffect(() => {
    const fetchAllowance = async () => {
      const tokenAllowance = await token?.functions.allowance(
        blockchainState.account,
        blockchainState.cheqAddress
      );
      if (amountWei.sub(tokenAllowance[0]) >= BigNumber.from(0)) {
        setNeedsApproval(true);
      } else {
        setNeedsApproval(false);
      }
    };
    if (formData.mode === "pay") {
      fetchAllowance();
    }
  }, []);

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{}}
        onSubmit={async (values, actions) => {
          console.log({ formData });
          if (needsApproval) {
            const tx = await token?.functions.approve(
              blockchainState.cheqAddress,
              amountWei
            );
            await tx.wait();
            setNeedsApproval(false);
            actions.setSubmitting(false);
          } else {
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
          }
        }}
      >
        {(props) => (
          <Form>
            <ConfirmNotice isInvoice={isInvoice}></ConfirmNotice>
            <ConfirmDetails></ConfirmDetails>
            <RoundedButton type="submit" isLoading={props.isSubmitting}>
              {buttonText}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqConfirmStep;
