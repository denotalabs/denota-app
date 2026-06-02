import { useToast } from "@chakra-ui/react";
import { Form, FormikProvider, useFormik } from "formik";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import { useRef } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import {
  hasValidPaymentAmount,
  useInsufficientBalance,
} from "../../../hooks/useInsufficientBalance";
import {
  quickPaymentButtonText,
  useQuickPayment,
} from "../../../hooks/useQuickPayment";
import { useRegistrarApproval } from "../../../hooks/useRegistrarApproval";
import { useUploadMetadata } from "../../../hooks/useUploadNote";
import RoundedBox from "../../designSystem/RoundedBox";
import RoundedButton from "../../designSystem/RoundedButton";
import { useStep } from "../../designSystem/stepper/Stepper";
import PaymentDetails from "./PaymentDetails";
import {
  hasPaymentMetadata,
  requiresRegistrarApproval,
  showsMetadataForm,
} from "./paymentMetadata";
import { getEffectiveAddress } from "../../../utils/ensAddress";
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
    onSuccess: () => router.push("/", undefined, { shallow: true }),
  });

  const submitContext = useRef<DetailsSubmitContext | null>(null);

  const formik = useFormik<DetailsStepFormValues>({
    initialValues: {
      token: notaFormValues.token ?? "USDC",
      amount: notaFormValues.amount ?? undefined,
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

  const paymentType = formik.values.paymentType;
  const showMetadataForm = showsMetadataForm(paymentType);
  const needsRegistrar = requiresRegistrarApproval(paymentType);
  const { needsApproval, approveAmount } = useRegistrarApproval(
    needsRegistrar,
    formik.values.token,
    formik.values.amount
  );
  const hasAmount = hasValidPaymentAmount(formik.values.amount);
  const requiresBalanceCheck =
    isWalletConnected && paymentType !== "withTerms" && hasAmount;
  const { insufficientBalance, isCheckingBalance, balanceChecked } =
    useInsufficientBalance(
      formik.values.token,
      formik.values.amount,
      requiresBalanceCheck
    );

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

  const isAwaitingBalanceCheck =
    requiresBalanceCheck && (!balanceChecked || isCheckingBalance);

  const balanceBlocksSubmit =
    paymentType !== "withTerms" &&
    (isAwaitingBalanceCheck || insufficientBalance);

  const buttonLabel = quickPaymentButtonText(
    paymentType,
    needsApproval,
    formik.values.token,
    paymentType !== "withTerms" && insufficientBalance
  );

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        <RoundedBox p={4}>
          <PaymentDetails
            token={formik.values.token}
            mode={formik.values.mode}
            showMetadata={showMetadataForm}
          />
        </RoundedBox>
        <RoundedButton
          mt={4}
          type="submit"
          isLoading={formik.isSubmitting}
          isDisabled={
            !isValid || !isWalletConnected || balanceBlocksSubmit
          }
        >
          {buttonLabel}
        </RoundedButton>
      </Form>
    </FormikProvider>
  );
}
