import { Field, FieldProps, FormikProps } from "formik";

import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  FormControl,
  FormErrorMessage,
  Input,
  Link,
  Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { blockExplorerAddressUrl } from "../../../context/config/chains";
import { useEnsAddress } from "../../../hooks/useEnsAddress";
import { usePrivyRecipient } from "../../../hooks/usePrivyRecipient";
import {
  classifyAccountInput,
  isPrivyIdentifierKind,
} from "../../../utils/accountIdentifier";
import { isEnsName } from "../../../utils/ensAddress";
import { FormInputWrap } from "../../designSystem/form/FormInputWrap";
import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props {
  fieldName: string;
  placeholder: string;
  isRequired?: boolean;
  allowEns?: boolean;
  allowPrivyIdentifier?: boolean;
  resolvedFieldName?: string;
  /** When set, wraps the field in a labeled FormSection. */
  label?: string;
  sectionMb?: number | string;
}

interface InnerProps extends Props {
  field: FieldProps["field"];
  form: FormikProps<{ [key: string]: string }>;
  touched: boolean;
  hasStarted: boolean;
  onInputStarted: () => void;
}

function invalidCopy(allowEns: boolean, allowPrivyIdentifier: boolean): string {
  if (allowEns && allowPrivyIdentifier) {
    return "Not a valid email, phone, ENS, or 0x address";
  }
  if (allowPrivyIdentifier) {
    return "Not a valid email, phone, or 0x address";
  }
  if (allowEns) {
    return "Not a valid ENS name or 0x address";
  }
  return "Not a valid 0x address";
}

function getResolvedFieldValue(
  inputValue: string,
  resolvedEnsAddress: string | null | undefined,
  resolvedPrivyAddress: string | null | undefined
): string {
  if (ethers.utils.isAddress(inputValue)) {
    return "";
  }
  const classified = classifyAccountInput(inputValue);
  if (classified.kind === "ens" && resolvedEnsAddress) {
    return resolvedEnsAddress;
  }
  if (isPrivyIdentifierKind(classified.kind) && resolvedPrivyAddress) {
    return resolvedPrivyAddress;
  }
  return "";
}

function AccountFieldInner({
  fieldName,
  field,
  form,
  touched,
  hasStarted,
  onInputStarted,
  placeholder,
  isRequired = true,
  allowEns = false,
  allowPrivyIdentifier = false,
  resolvedFieldName,
  label,
  sectionMb,
}: InnerProps) {
  const { setFieldValue, setFieldError, values } = form;
  const { blockchainState } = useBlockchainData();
  const currentResolved = resolvedFieldName
    ? (values[resolvedFieldName] ?? "")
    : "";

  const classified = useMemo(
    () => classifyAccountInput(field.value ?? ""),
    [field.value]
  );

  const { address: resolvedEnsAddress, isLoading: isEnsLoading } =
    useEnsAddress(
      allowEns && classified.kind === "ens" ? field.value : undefined
    );

  const {
    address: resolvedPrivyAddress,
    isLoading: isPrivyLoading,
    needsAuth: privyNeedsAuth,
  } = usePrivyRecipient(
    allowPrivyIdentifier && isPrivyIdentifierKind(classified.kind)
      ? field.value
      : undefined
  );

  const isResolving = isEnsLoading || isPrivyLoading;

  const resolutionError = useMemo(() => {
    if (allowEns && classified.kind === "ens") {
      if (isEnsLoading) {
        return undefined;
      }
      if (resolvedEnsAddress === null) {
        return "Invalid address";
      }
    }
    if (allowPrivyIdentifier && isPrivyIdentifierKind(classified.kind)) {
      if (privyNeedsAuth) {
        return "Log in to send to email or phone";
      }
      if (isPrivyLoading) {
        return undefined;
      }
      if (resolvedPrivyAddress === null) {
        return "Could not create a wallet for that email or phone";
      }
    }
    return undefined;
  }, [
    allowEns,
    allowPrivyIdentifier,
    classified.kind,
    isEnsLoading,
    isPrivyLoading,
    privyNeedsAuth,
    resolvedEnsAddress,
    resolvedPrivyAddress,
  ]);

  useEffect(() => {
    if (
      !(allowEns && classified.kind === "ens") &&
      !(allowPrivyIdentifier && isPrivyIdentifierKind(classified.kind))
    ) {
      return;
    }
    setFieldError(fieldName, resolutionError);
  }, [
    allowEns,
    allowPrivyIdentifier,
    classified.kind,
    fieldName,
    resolutionError,
    setFieldError,
  ]);

  useEffect(() => {
    if (!resolvedFieldName) {
      return;
    }
    if (!allowEns && !allowPrivyIdentifier) {
      return;
    }

    const nextResolved = getResolvedFieldValue(
      field.value,
      allowEns ? resolvedEnsAddress : undefined,
      allowPrivyIdentifier ? resolvedPrivyAddress : undefined
    );
    if (currentResolved !== nextResolved) {
      setFieldValue(resolvedFieldName, nextResolved, false);
    }
  }, [
    allowEns,
    allowPrivyIdentifier,
    currentResolved,
    field.value,
    resolvedEnsAddress,
    resolvedFieldName,
    resolvedPrivyAddress,
    setFieldValue,
  ]);

  const ensFound =
    allowEns &&
    classified.kind === "ens" &&
    !isEnsLoading &&
    !!resolvedEnsAddress;
  const privyFound =
    allowPrivyIdentifier &&
    isPrivyIdentifierKind(classified.kind) &&
    !isPrivyLoading &&
    !privyNeedsAuth &&
    !!resolvedPrivyAddress;

  const trimmed = field.value?.trim() ?? "";
  const isDirectAddress = ethers.utils.isAddress(trimmed);
  const isEmpty = trimmed.length === 0;
  const isIncomplete = classified.kind === "incomplete";

  const isValidValue =
    !isEmpty && (isDirectAddress || ensFound || privyFound);
  const isInvalidValue =
    !isEmpty &&
    !isDirectAddress &&
    !ensFound &&
    !privyFound &&
    !isResolving &&
    !privyNeedsAuth &&
    !isIncomplete &&
    classified.kind !== "ens" &&
    !isPrivyIdentifierKind(classified.kind);

  const showInteraction = touched || hasStarted;

  const resolvedAddr =
    currentResolved ||
    resolvedEnsAddress ||
    resolvedPrivyAddress ||
    (isDirectAddress ? trimmed : "");
  const displayResolvedAddr =
    resolvedAddr && ethers.utils.isAddress(resolvedAddr)
      ? ethers.utils.getAddress(resolvedAddr)
      : resolvedAddr;
  const showResolvedHelper =
    showInteraction &&
    (ensFound || privyFound) &&
    !!displayResolvedAddr;

  const explorerUrl = blockExplorerAddressUrl(
    blockchainState.explorer,
    resolvedAddr
  );

  const helperText = (() => {
    if (!showInteraction) {
      return null;
    }
    if (privyNeedsAuth && isPrivyIdentifierKind(classified.kind)) {
      return "Log in to send to email or phone";
    }
    if (isInvalidValue) {
      return classified.message || invalidCopy(allowEns, allowPrivyIdentifier);
    }
    return null;
  })();

  const content = (
    <>
      <FormInputWrap>
        <Input
          {...field}
          variant="unstyled"
          flex={1}
          minW={0}
          h={{ base: "54px", md: "48px" }}
          fontSize={{ base: "17px", md: "15px" }}
          color={formTheme.text}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            if (event.target.value !== "") {
              onInputStarted();
            }
            field.onChange(event);
          }}
          onBlur={(event) => {
            field.onBlur(event);
            form.setFieldTouched(fieldName, true, false);
          }}
        />
        {showInteraction && isValidValue ? (
          <Link
            href={explorerUrl}
            isExternal
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            minW="38px"
            minH="38px"
            borderRadius="10px"
            bg={formTheme.selectedBgMuted}
            color={formTheme.primary}
            _hover={{ bg: formTheme.cardBgHover }}
            flexShrink={0}
            aria-label="View on block explorer"
          >
            <ExternalLinkIcon boxSize={3.5} />
          </Link>
        ) : null}
        {showInteraction && isInvalidValue ? (
          <X
            size={20}
            strokeWidth={3}
            color={formTheme.error}
            style={{ flexShrink: 0 }}
          />
        ) : null}
      </FormInputWrap>
      {showResolvedHelper ? (
        <Text
          mt={1.5}
          fontSize="13px"
          lineHeight={1.45}
          color={formTheme.muted}
          wordBreak="break-all"
        >
          {displayResolvedAddr}
        </Text>
      ) : null}
      {helperText ? (
        <Text
          display="block"
          mt={1.5}
          fontSize="13px"
          color={formTheme.error}
          fontWeight={500}
        >
          {helperText}
        </Text>
      ) : null}
      {form.errors[fieldName] &&
      showInteraction &&
      !ensFound &&
      !privyFound &&
      !isInvalidValue &&
      !helperText ? (
        <FormControl isInvalid>
          <FormErrorMessage>
            {form.errors[fieldName] as string}
          </FormErrorMessage>
        </FormControl>
      ) : null}
    </>
  );

  if (!label) {
    return content;
  }

  return (
    <FormSection label={label} mb={sectionMb ?? 5}>
      {content}
    </FormSection>
  );
}

function AccountField({
  fieldName,
  placeholder,
  isRequired = true,
  allowEns = false,
  allowPrivyIdentifier = false,
  resolvedFieldName,
  label,
  sectionMb,
}: Props) {
  const [hasStarted, setHasStarted] = useState(false);
  const onInputStarted = useCallback(() => {
    setHasStarted(true);
  }, []);

  const validateAddress = useCallback(
    (value: string) => {
      if (!isRequired && value === "") {
        return undefined;
      }

      const classified = classifyAccountInput(value);
      if (classified.kind === "empty") {
        return isRequired ? "Invalid address" : undefined;
      }
      if (classified.kind === "address") {
        return undefined;
      }
      if (allowEns && (classified.kind === "ens" || isEnsName(value))) {
        return undefined;
      }
      if (
        allowPrivyIdentifier &&
        (isPrivyIdentifierKind(classified.kind) ||
          classified.kind === "incomplete")
      ) {
        return classified.kind === "incomplete" && classified.message
          ? classified.message
          : undefined;
      }
      if (allowEns && classified.kind === "incomplete") {
        return undefined;
      }
      return classified.message || invalidCopy(allowEns, allowPrivyIdentifier);
    },
    [allowEns, allowPrivyIdentifier, isRequired]
  );

  return (
    <Field name={fieldName} validate={validateAddress}>
      {({ field, form }: FieldProps) => (
        <AccountFieldInner
          fieldName={fieldName}
          field={field}
          form={form}
          touched={Boolean(form.touched[fieldName])}
          hasStarted={hasStarted}
          onInputStarted={onInputStarted}
          placeholder={placeholder}
          isRequired={isRequired}
          allowEns={allowEns}
          allowPrivyIdentifier={allowPrivyIdentifier}
          resolvedFieldName={resolvedFieldName}
          label={label}
          sectionMb={sectionMb}
        />
      )}
    </Field>
  );
}

export default AccountField;
