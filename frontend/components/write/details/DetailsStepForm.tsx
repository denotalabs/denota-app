import {
  Box,
  Text,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { Form, FormikProvider, useFormik } from "formik";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { usePaymentReadiness } from "../../../hooks/usePaymentReadiness";
import { usePurchaseToken } from "../../../hooks/usePurchaseToken";
import {
  quickPaymentButtonText,
  useQuickPayment,
} from "../../../hooks/useQuickPayment";
import { useTokens } from "../../../hooks/useTokens";
import { useUploadMetadata } from "../../../hooks/useUploadNote";
import { useVisualViewportKeyboard } from "../../../hooks/useVisualViewportKeyboard";
import {
  type AttachmentStorageSettings,
  normalizeStorageSettings,
} from "../../../utils/attachmentStorage";
import { getEffectiveAddress } from "../../../utils/ensAddress";
import { normalizePaymentMetadataUris } from "../../../utils/metadataUri";
import { hasValidPaymentAmount } from "../../../utils/paymentValidation";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import { formTheme } from "../../designSystem/form/formTheme";
import { useStep } from "../../designSystem/stepper/Stepper";
import PaymentDetails from "./PaymentDetails";
import { PaymentDetailsContinueButton } from "./PaymentDetailsContinueButton";
import { PaymentFlowStepRow } from "./PaymentFlowStepRow";
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
  attachmentStorage: AttachmentStorageSettings;
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
  const { displayNameForCurrency } = useTokens();
  const isWalletConnected = blockchainState.account !== "";
  const toast = useToast();
  const { executeQuickPayment } = useQuickPayment({
    onSuccess: () => router.push("/dashboard"),
  });
  const { purchaseToken, canPurchaseToken } = usePurchaseToken();
  const keyboardOpen = useVisualViewportKeyboard();
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;

  const submitContext = useRef<DetailsSubmitContext | null>(null);

  const formik = useFormik<DetailsStepFormValues>({
    initialValues: {
      token: notaFormValues.token ?? "USDC",
      amount: notaFormValues.amount ?? "0",
      address: notaFormValues.address ?? "",
      resolvedAddress: notaFormValues.resolvedAddress ?? "",
      mode: "pay",
      paymentType:
        (notaFormValues.paymentType as PaymentType) || "withTerms",
      note: notaFormValues.note ?? "",
      email: notaFormValues.email ?? "",
      file: file,
      tags: notaFormValues.tags ?? "",
      externalURI: notaFormValues.externalURI ?? "",
      imageURI: notaFormValues.imageURI ?? "",
      attachmentStorage: normalizeStorageSettings(
        notaFormValues.attachmentStorage
      ),
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
      const normalizedMetadata = normalizePaymentMetadataUris(values);
      const { externalURI } = normalizedMetadata;
      let imageURI = normalizedMetadata.imageURI;

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
        externalURI,
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
        externalURI,
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
      attachmentStorage: formik.values.attachmentStorage,
    });
  }, [
    formik.values.attachmentStorage,
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
    displayNameForCurrency(formik.values.token),
    paymentType !== "withTerms" && insufficientBalance,
    isCheckingReadiness
  );

  const isSubmitDisabled =
    !isValid ||
    (requiresWallet && !isWalletConnected) ||
    balanceBlocksSubmit;

  const continueButton = (
    <PaymentDetailsContinueButton
      isLoading={formik.isSubmitting}
      isDisabled={isSubmitDisabled}
    >
      {buttonLabel}
    </PaymentDetailsContinueButton>
  );

  const usePinnedCta = isMobile && !keyboardOpen;
  const scrollBottomPadding = usePinnedCta ? "130px" : isMobile ? 4 : 0;

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        <Box
          w="100%"
          maxW={{ base: "380px", md: "100%" }}
          mx="auto"
          mt={3}
          px={{ base: 4, md: 1 }}
          pb={scrollBottomPadding}
          color={formTheme.text}
        >
          <PaymentFlowStepRow paymentType={paymentType} activeIndex={0} />
          <Text
            fontSize={{ base: "28px", md: "xl" }}
            fontWeight={700}
            textAlign="center"
            mb={5}
            letterSpacing="-0.5px"
            color={formTheme.textDark}
            display={{ base: "block", md: "none" }}
          >
            Payment Details
          </Text>
          <PaymentDetails showMetadata={showMetadataForm} />
          {isMobile && keyboardOpen ? (
            <Box mt={2} mb={2}>{continueButton}</Box>
          ) : null}
          {!isMobile ? <Box mt={4}>{continueButton}</Box> : null}
          {usePinnedCta ? (
            <Box
              position="fixed"
              bottom={0}
              left={0}
              right={0}
              zIndex={10}
              px={5}
              pt={4}
              pb="calc(18px + env(safe-area-inset-bottom))"
              bgGradient={formTheme.ctaBarGradient}
              pointerEvents="none"
            >
              <Box pointerEvents="auto">{continueButton}</Box>
            </Box>
          ) : null}
        </Box>
      </Form>
    </FormikProvider>
  );
}
