import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useConfirmNota } from "../../../hooks/useConfirmNota";
import { usePaymentReadiness } from "../../../hooks/usePaymentReadiness";
import { usePurchaseToken } from "../../../hooks/usePurchaseToken";
import { useTokens } from "../../../hooks/useTokens";
import { paymentButtonText } from "../../../utils/paymentButtonText";
import { hasValidPaymentAmount } from "../../../utils/paymentValidation";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";

import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps } from "../../designSystem/stepper/Stepper";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";
import { TechnicalDetails } from "./TechnicalDetails";

const ConfirmNotaStep: React.FC<ScreenProps> = () => {
  const { notaFormValues } = useNotaForm();
  const { blockchainState, connectWallet } = useBlockchainData();
  const { displayNameForCurrency } = useTokens();
  const isWalletConnected = blockchainState.account !== "";
  const router = useRouter();
  const { purchaseToken, canPurchaseToken } = usePurchaseToken();

  const paymentToken = notaFormValues.token as NotaCurrency;
  const isPayMode = notaFormValues.mode === "pay";
  const requiresBalanceCheck =
    isWalletConnected &&
    isPayMode &&
    hasValidPaymentAmount(notaFormValues.amount);

  const approvalCheckEnabled = isWalletConnected && isPayMode;

  const {
    insufficientBalance,
    needsApproval,
    isChecking: isCheckingReadiness,
    approveAmount,
  } = usePaymentReadiness({
    token: notaFormValues.token,
    amount: notaFormValues.amount,
    balanceCheckEnabled: requiresBalanceCheck,
    approvalCheckEnabled,
  });

  const showPurchaseOnInsufficient =
    insufficientBalance && canPurchaseToken(paymentToken);

  const { writeNota } = useConfirmNota({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  const buttonText = useMemo(
    () =>
      paymentButtonText({
        token: displayNameForCurrency(notaFormValues.token),
        isWalletConnected,
        isCheckingReadiness,
        insufficientBalance,
        needsApproval,
        mode: notaFormValues.mode,
      }),
    [
      displayNameForCurrency,
      insufficientBalance,
      isCheckingReadiness,
      isWalletConnected,
      needsApproval,
      notaFormValues.mode,
      notaFormValues.token,
    ]
  );

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
            if (insufficientBalance) {
              if (showPurchaseOnInsufficient) {
                await purchaseToken(
                  paymentToken,
                  notaFormValues.amount as string
                );
              }
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
            <ConfirmDetails />
            <TechnicalDetails
              needsApproval={isWalletConnected && needsApproval}
              tokenLabel={displayNameForCurrency(notaFormValues.token)}
            />
            <RoundedButton
              type="submit"
              isLoading={props.isSubmitting}
              isDisabled={
                isWalletConnected &&
                (isCheckingReadiness ||
                  (insufficientBalance && !showPurchaseOnInsufficient))
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
