import { Box, useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useCheqContext } from "../../../context/CheqsContext";
import { useDirectPay } from "../../../hooks/modules/useDirectPay";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";

interface Props extends ScreenProps {
  isInvoice: boolean;
}

const CheqConfirmStep: React.FC<Props> = ({ isInvoice }: Props) => {
  const toast = useToast();

  const { onClose, formData } = useStep();
  const { blockchainState } = useBlockchainData();

  const [needsApproval, setNeedsApproval] = useState(formData.mode === "pay");

  const token =
    formData.token == "DAI" ? blockchainState.dai : blockchainState.weth;

  const amountWei = ethers.utils.parseEther(formData.amount);

  const escrowedWei =
    formData.mode === "invoice" ? BigNumber.from(0) : amountWei;

  const { refreshWithDelay } = useCheqContext();

  console.log({ xp: ethers.utils.formatBytes32String(formData.noteKey) });

  const tokenAddress = useMemo(() => {
    switch (formData.token) {
      case "DAI":
        return blockchainState.dai?.address ?? "";
      case "WETH":
        return blockchainState.weth?.address ?? "";
      default:
        return "";
    }
  }, [
    blockchainState.dai?.address,
    blockchainState.weth?.address,
    formData.token,
  ]);

  const { writeCheq: writeDirectPayCheq } = useDirectPay({
    dueDate: formData.dueDate,
    tokenAddress,
    amountWei,
    address: formData.address,
    escrowedWei,
    noteKey: formData.noteKey,
    isInvoice,
  });

  const buttonText = useMemo(() => {
    if (needsApproval) {
      return "Approve " + formData.token;
    }
    return formData.mode === "invoice" ? "Create Invoice" : "Confirm Payment";
  }, [formData.mode, formData.token, needsApproval]);

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
  }, [
    amountWei,
    blockchainState.account,
    blockchainState.cheqAddress,
    formData.mode,
    token?.functions,
  ]);

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          module: formData.module ?? "direct",
        }}
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
            try {
              switch (formData.module) {
                case "direct":
                  await writeDirectPayCheq();
                  break;
                default:
                  break;
              }
              const message =
                formData.mode === "invoice"
                  ? "Invoice created"
                  : "Cheq created";
              toast({
                title: "Transaction succeeded",
                description: message,
                status: "success",
                duration: 3000,
                isClosable: true,
              });
              refreshWithDelay();
              onClose?.();
            } catch (error) {
              console.log(error);
              toast({
                title: "Transaction failed",
                status: "error",
                duration: 3000,
                isClosable: true,
              });
            } finally {
              actions.setSubmitting(false);
            }
          }
        }}
      >
        {(props) => (
          <Form>
            <ConfirmNotice
              isInvoice={formData.mode === "invoice"}
              module={props.values.module}
            ></ConfirmNotice>
            <ConfirmDetails isInvoice={isInvoice}></ConfirmDetails>
            <RoundedButton type="submit" isLoading={props.isSubmitting}>
              {buttonText}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default CheqConfirmStep;
