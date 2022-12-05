import { Box, Button, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useStep } from "../../designSystem/stepper/Stepper";
import RoundedButton from "../../designSystem/RoundedButton";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqConfirmStep({ isInvoice }: Props) {
  const { onClose, formData, back } = useStep();
  const blockchainState = useBlockchainData();

  const [needsApproval, setNeedsApproval] = useState(formData.mode === "pay");

  const token =
    formData.token == "DAI" ? blockchainState.dai : blockchainState.weth;

  const amountWei = ethers.utils.parseEther(formData.amount);

  const buttonText = useMemo(() => {
    if (needsApproval) {
      return "Approve " + formData.token;
    }
    return formData.mode === "invoice" ? "Create Invoice" : "Confirm Payment";
  }, [needsApproval]);

  useEffect(() => {
    const fetchAllowance = async () => {
      const tokenAllowance = await token?.functions.allowance(
        blockchainState.account,
        blockchainState.cheqAddress
      );
      if (amountWei.sub(tokenAllowance[0]) > BigNumber.from(0)) {
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
          if (needsApproval) {
            // Disabling infinite approvals until audit it complete
            // To enable:
            // BigNumber.from(
            //   "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            // );
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
                case "DAI":
                  tokenAddress = blockchainState.dai?.address ?? "";
                  break;
                case "WETH":
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
                alert("TX hash " + tx.hash);
              } catch (error) {
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
            <ConfirmNotice
              isInvoice={formData.mode === "invoice"}
            ></ConfirmNotice>
            <ConfirmDetails></ConfirmDetails>
            <RoundedButton type="submit" isLoading={props.isSubmitting}>
              {buttonText}
            </RoundedButton>
            <RoundedButton
              onClick={() => {
                back?.();
              }}
            >
              {"Back"}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqConfirmStep;
