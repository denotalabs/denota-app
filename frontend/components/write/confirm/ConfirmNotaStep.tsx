import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useConfirmNota } from "../../../hooks/useConfirmNota";
import {
  hasValidPaymentAmount,
  useInsufficientBalance,
} from "../../../hooks/useInsufficientBalance";

import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps } from "../../designSystem/stepper/Stepper";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";

const ConfirmNotaStep: React.FC<ScreenProps> = () => {
  const { notaFormValues } = useNotaForm();
  const { blockchainState, connectWallet } = useBlockchainData();
  const isWalletConnected = blockchainState.account !== "";
  const { needsApproval, approveAmount, writeNota } = useConfirmNota({
    onSuccess: () => {
      router.push("/", undefined, { shallow: true });
    },
  });

  const router = useRouter();

  const isPayMode = notaFormValues.mode === "pay";
  const requiresBalanceCheck =
    isWalletConnected &&
    isPayMode &&
    hasValidPaymentAmount(notaFormValues.amount);

  const { insufficientBalance, isCheckingBalance, balanceChecked } =
    useInsufficientBalance(
      notaFormValues.token,
      notaFormValues.amount,
      requiresBalanceCheck
    );

  const isAwaitingBalanceCheck =
    requiresBalanceCheck && (!balanceChecked || isCheckingBalance);

  const buttonText = useMemo(() => {
    if (!isWalletConnected) {
      return "Connect wallet";
    }
    if (isAwaitingBalanceCheck) {
      return "Confirm Payment";
    }
    if (insufficientBalance) {
      return "Insufficient balance";
    }
    if (needsApproval) {
      return "Approve " + notaFormValues.token;
    }
    return notaFormValues.mode === "invoice"
      ? "Create Invoice"
      : "Confirm Payment";
  }, [
    insufficientBalance,
    isAwaitingBalanceCheck,
    isWalletConnected,
    needsApproval,
    notaFormValues.mode,
    notaFormValues.token,
  ]);

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{}}
        onSubmit={async (_values, actions) => {
          try {
            if (!isWalletConnected) {
              await connectWallet?.();
              return;
            }
            if (needsApproval) {
              await approveAmount();
            } else {
              await writeNota();
            }
          } finally {
            actions.setSubmitting(false);
          }
        }}
      >
        {(props) => (
          <Form>
            <ConfirmNotice />
            <ConfirmDetails></ConfirmDetails>
            <RoundedButton
              type="submit"
              isLoading={props.isSubmitting}
              isDisabled={
                isWalletConnected &&
                (isAwaitingBalanceCheck || insufficientBalance)
              }
            >
              {buttonText}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default ConfirmNotaStep;
