import { useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { Form, FormikProvider, useFormik } from "formik";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { hasValidPaymentAmount } from "../../../utils/paymentValidation";
import { usePaymentReadiness } from "../../../hooks/usePaymentReadiness";
import {
  usePurchaseToken,
} from "../../../hooks/usePurchaseToken";
import {
  quickPaymentButtonText,
  useQuickPayment,
} from "../../../hooks/useQuickPayment";
import { useUploadMetadata } from "../../../hooks/useUploadNote";
import { getEffectiveAddress } from "../../../utils/ensAddress";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import RoundedBox from "../../designSystem/RoundedBox";
import RoundedButton from "../../designSystem/RoundedButton";
import { useStep } from "../../designSystem/stepper/Stepper";
import PaymentDetails from "./PaymentDetails";
import {
  allowsZeroPaymentAmount,
  hasPaymentMetadata,
  requiresRegistrarApproval,
  showsMetadataForm,
} from "./paymentMetadata";
import { PaymentType } from "./PaymentTypeField";

export type DetailsStepFormValues = {
  token: string;
  amount: string | undefined;
  address: string;
  resolvedAddress: string;
  mode: string;
  paymentType: PaymentType;
  note: string;
  email: string;
  file?: File;
  tags: string;
  externalURI: string;
  imageURI: string;
};

type DetailsSubmitContext = {
  needsApproval: boolean;
  approveAmount: () => Promise<void>;
  next?: () => void;
  upload: ReturnType<typeof useUploadMetadata>["upload"];
  toast: ReturnType<typeof useToast>;
  notaFormValues: ReturnType<typeof useNotaForm>["notaFormValues"];
  file: File | undefined;
  updateNotaFormValues: ReturnType<typeof useNotaForm>["updateNotaFormValues"];
  setFile: ReturnType<typeof useNotaForm>["setFile"];
  executeQuickPayment: ReturnType<typeof useQuickPayment>["executeQuickPayment"];
  insufficientBalance: boolean;
  showPurchaseOnInsufficient: boolean;
  purchaseToken: ReturnType<typeof usePurchaseToken>["purchaseToken"];
};

export function DetailsStepForm() {
  const { next } = useStep();
  const router = useRouter();
  const { notaFormValues, file, updateNotaFormValues, setFile } = useNotaForm();
  const { upload } = useUploadMetadata();
  const { blockchainState } = useBlockchainData();
  const isWalletConnected = blockchainState.account !== "";
  const toast = useToast();
  const { executeQuickPayment } = useQuickPayment({
    onSuccess: () => router.push("/dashboard"),
  });
  const { purchaseToken, canPurchaseToken } = usePurchaseToken();

  const submitContext = useRef<DetailsSubmitContext | null>(null);

  const formik = useFormik<DetailsStepFormValues>({
    initialValues: {
      token: notaFormValues.token ?? "USDC",
      amount: notaFormValues.amount ?? "0",
      address: notaFormValues.address ?? "",
      resolvedAddress: notaFormValues.resolvedAddress ?? "",
      mode: "pay",
      paymentType: (notaFormValues.paymentType as PaymentType) ?? "withTerms",
      note: notaFormValues.note ?? "",
      email: notaFormValues.email ?? "",
      file: file,
      tags: notaFormValues.tags ?? "",
      externalURI: notaFormValues.externalURI ?? "",
      imageURI: notaFormValues.imageURI ?? "",
    },
    onSubmit: async (values) => {
      const ctx = submitContext.current;
      if (!ctx) {
        return;
      }
      const paymentType = values.paymentType;
      const metadataFilled = hasPaymentMetadata(values);
      const showMetadataForm = showsMetadataForm(paymentType);
      let ipfsHash = ctx.notaFormValues.ipfsHash as string | undefined;
      let imageURI = values.imageURI;

      if (showMetadataForm && metadataFilled) {
        const metadataChanged =
          ctx.notaFormValues.note !== values.note ||
          values.file?.name !== ctx.file?.name ||
          ctx.notaFormValues.tags !== values.tags;

        if (metadataChanged) {
          const result = await ctx.upload(values.file, values.note, values.tags);

          if (result?.ipfsHash === undefined) {
            ctx.toast({
              title: "Error uploading file",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            return;
          }
          ipfsHash = result.ipfsHash;
          imageURI = result.imageURI ?? imageURI;
        }
      }

      const recipientAddress = getEffectiveAddress(
        values.address,
        values.resolvedAddress
      );

      ctx.updateNotaFormValues({
        note: values.note,
        email: values.email,
        tags: values.tags,
        externalURI: values.externalURI,
        imageURI,
        ipfsHash,
        paymentType,
        token: values.token,
        amount: values.amount ? String(Number(values.amount)) : "",
        address: values.address,
        resolvedAddress: values.resolvedAddress,
        mode: values.mode,
        ...(paymentType !== "withTerms" && { module: "directSend" }),
      });

      if (values.file) {
        ctx.setFile?.(values.file);
      }

      if (paymentType === "withTerms") {
        ctx.next?.();
        return;
      }

      if (ctx.insufficientBalance) {
        if (ctx.showPurchaseOnInsufficient && values.amount) {
          await ctx.purchaseToken(
            values.token as NotaCurrency,
            values.amount
          );
        }
        return;
      }

      if (!values.amount) {
        return;
      }

      const needsRegistrar = requiresRegistrarApproval(paymentType);
      if (needsRegistrar && ctx.needsApproval) {
        await ctx.approveAmount();
        return;
      }

      await ctx.executeQuickPayment({
        token: values.token,
        amount: values.amount,
        address: recipientAddress,
        paymentType,
        note: values.note,
        email: values.email,
        file: values.file,
        tags: values.tags,
        externalURI: values.externalURI,
        imageURI,
        ipfsHash,
      });
    },
  });

  useEffect(() => {
    updateNotaFormValues({
      paymentType: formik.values.paymentType,
      note: formik.values.note,
      email: formik.values.email,
      tags: formik.values.tags,
      externalURI: formik.values.externalURI,
      imageURI: formik.values.imageURI,
    });
  }, [
    formik.values.email,
    formik.values.externalURI,
    formik.values.imageURI,
    formik.values.note,
    formik.values.paymentType,
    formik.values.tags,
    updateNotaFormValues,
  ]);

  const paymentType = formik.values.paymentType;
  const showMetadataForm = showsMetadataForm(paymentType);
  const needsRegistrar = requiresRegistrarApproval(paymentType);
  const hasAmount = allowsZeroPaymentAmount(paymentType)
    ? formik.values.amount !== undefined &&
      formik.values.amount !== "" &&
      !Number.isNaN(Number(formik.values.amount)) &&
      Number(formik.values.amount) >= 0
    : hasValidPaymentAmount(formik.values.amount);
  const requiresBalanceCheck =
    isWalletConnected &&
    paymentType !== "withTerms" &&
    hasAmount &&
    Number(formik.values.amount) > 0;
  const approvalCheckEnabled = isWalletConnected && needsRegistrar;
  const {
    insufficientBalance,
    needsApproval,
    isChecking: isCheckingReadiness,
    approveAmount,
  } = usePaymentReadiness({
    token: formik.values.token,
    amount: formik.values.amount,
    balanceCheckEnabled: requiresBalanceCheck,
    approvalCheckEnabled,
  });
  const paymentToken = formik.values.token as NotaCurrency;
  const showPurchaseOnInsufficient =
    insufficientBalance && canPurchaseToken(paymentToken);

  submitContext.current = {
    needsApproval,
    approveAmount,
    next,
    upload,
    toast,
    notaFormValues,
    file,
    updateNotaFormValues,
    setFile,
    executeQuickPayment,
    insufficientBalance,
    showPurchaseOnInsufficient,
    purchaseToken,
  };

  const recipientAddress = getEffectiveAddress(
    formik.values.address,
    formik.values.resolvedAddress
  );
  const hasValidRecipient =
    !!formik.values.address &&
    (ethers.utils.isAddress(formik.values.address) ||
      ethers.utils.isAddress(recipientAddress));

  const isValid =
    !formik.errors.address &&
    !formik.errors.amount &&
    hasValidRecipient &&
    hasAmount;

  const balanceBlocksSubmit =
    paymentType !== "withTerms" &&
    (isCheckingReadiness ||
      (insufficientBalance && !showPurchaseOnInsufficient));

  const requiresWallet = paymentType !== "withTerms";

  const buttonLabel = quickPaymentButtonText(
    paymentType,
    needsApproval,
    formik.values.token,
    paymentType !== "withTerms" && insufficientBalance,
    isCheckingReadiness
  );

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        <RoundedBox p={4}>
          <PaymentDetails showMetadata={showMetadataForm} />
        </RoundedBox>
        <RoundedButton
          mt={4}
          type="submit"
          isLoading={formik.isSubmitting}
          isDisabled={
            !isValid ||
            (requiresWallet && !isWalletConnected) ||
            balanceBlocksSubmit
          }
        >
          {buttonLabel}
        </RoundedButton>
      </Form>
    </FormikProvider>
  );
}
