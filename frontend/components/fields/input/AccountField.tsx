import { Field, FieldProps, FormikProps } from "formik";

import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Input, Link, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { blockExplorerAddressUrl } from "../../../context/config/chains";
import { useResolvedAccount } from "../../../hooks/useResolvedAccount";
import {
  classifyAccountInput,
  isAccountInputInProgress,
  isLookupAccountKind,
  type AccountInputKind,
} from "../../../utils/accountIdentity";
import { FormInputWrap } from "../../designSystem/form/FormInputWrap";
import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props {
  fieldName: string;
  placeholder: string;
  isRequired?: boolean;
  allowEns?: boolean;
  resolvedFieldName?: string;
  /** When set, wraps the field in a labeled FormSection. */
  label?: string;
  sectionMb?: number | string;
  /**
   * Field-level validate. Disable when this input is mounted only for some
   * answers: Formik still runs it on the switch away, then leaves the error
   * after unmount. Parent form validate should cover the field instead.
   */
  useFieldValidate?: boolean;
}

interface InnerProps extends Props {
  field: FieldProps["field"];
  form: FormikProps<{ [key: string]: string }>;
  touched: boolean;
  hasStarted: boolean;
  onInputStarted: () => void;
}

function getResolutionError(
  kind: AccountInputKind,
  isLoading: boolean,
  resolvedAddress: string | null | undefined,
  didFail: boolean
): string | undefined {
  if (!isLookupAccountKind(kind) || isLoading) {
    return undefined;
  }
  if (resolvedAddress) {
    return undefined;
  }
  if (didFail) {
    return kind === "email"
      ? "Couldn't look up this email"
      : "Couldn't look up this phone number";
  }
  if (resolvedAddress === undefined) {
    return undefined;
  }
  if (kind === "ens") {
    return "Invalid address";
  }
  if (kind === "email") {
    return "No wallet found for this email";
  }
  return "No wallet found for this phone number";
}

function getResolvedFieldValue(
  inputValue: string,
  resolvedAddress: string | null | undefined
): string {
  if (ethers.utils.isAddress(inputValue)) {
    return "";
  }
  if (resolvedAddress && ethers.utils.isAddress(resolvedAddress)) {
    return resolvedAddress;
  }
  return "";
}

function invalidMessage(kind: AccountInputKind, didFail: boolean): string {
  if (didFail && kind === "email") {
    return "Couldn't look up this email";
  }
  if (didFail && kind === "phone") {
    return "Couldn't look up this phone number";
  }
  if (kind === "email") {
    return "No wallet found for this email";
  }
  if (kind === "phone") {
    return "No wallet found for this phone number";
  }
  if (kind === "ens") {
    return "Invalid address";
  }
  return "Not a valid Email, phone, ENS name, or 0x address";
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
  resolvedFieldName,
  label,
  sectionMb,
}: InnerProps) {
  const { setFieldValue, setFieldError, values } = form;
  const { blockchainState } = useBlockchainData();
  const currentResolved = resolvedFieldName
    ? (values[resolvedFieldName] ?? "")
    : "";

  const {
    address: resolvedAddress,
    isLoading,
    kind,
    didFail,
  } = useResolvedAccount(field.value, { allowEns });

  const resolutionError = useMemo(
    () => getResolutionError(kind, isLoading, resolvedAddress, didFail),
    [didFail, kind, isLoading, resolvedAddress]
  );

  useEffect(() => {
    if (!isLookupAccountKind(kind)) {
      return;
    }
    setFieldError(fieldName, resolutionError);
  }, [fieldName, kind, resolutionError, setFieldError]);

  useEffect(() => {
    return () => {
      setFieldError(fieldName, undefined);
    };
  }, [fieldName, setFieldError]);

  useEffect(() => {
    if (!resolvedFieldName) {
      return;
    }

    const nextResolved = getResolvedFieldValue(field.value, resolvedAddress);
    if (currentResolved !== nextResolved) {
      setFieldValue(resolvedFieldName, nextResolved, false);
    }
  }, [
    currentResolved,
    field.value,
    resolvedAddress,
    resolvedFieldName,
    setFieldValue,
  ]);

  const lookupFound =
    isLookupAccountKind(kind) && !isLoading && !!resolvedAddress;

  const trimmed = field.value?.trim() ?? "";
  const isDirectAddress = ethers.utils.isAddress(trimmed);
  const isEmpty = trimmed.length === 0;

  const lookupPending =
    isLookupAccountKind(kind) &&
    (isLoading || (resolvedAddress === undefined && !didFail));

  const isValidValue = !isEmpty && (isDirectAddress || lookupFound);
  const isInvalidValue =
    !isEmpty &&
    !isDirectAddress &&
    !lookupFound &&
    !lookupPending &&
    !isAccountInputInProgress(kind);

  const showInteraction = touched || hasStarted;

  const resolvedAddr =
    currentResolved ||
    resolvedAddress ||
    (isDirectAddress ? trimmed : "");
  const displayResolvedAddr =
    resolvedAddr && ethers.utils.isAddress(resolvedAddr)
      ? ethers.utils.getAddress(resolvedAddr)
      : resolvedAddr;
  const showResolvedHelper =
    showInteraction && lookupFound && !!displayResolvedAddr;
  const formError =
    showInteraction && !lookupFound && !isInvalidValue
      ? (form.errors[fieldName] as string | undefined)
      : undefined;
  const helperMessage = showResolvedHelper
    ? displayResolvedAddr
    : showInteraction && isInvalidValue
      ? invalidMessage(kind, didFail)
      : formError || "";
  const helperIsError = Boolean(helperMessage) && !showResolvedHelper;

  const explorerUrl = blockExplorerAddressUrl(
    blockchainState.explorer,
    resolvedAddr
  );

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
      <Text
        mt={1.5}
        minH="1.45em"
        fontSize="13px"
        lineHeight={1.45}
        color={helperIsError ? formTheme.error : formTheme.muted}
        fontWeight={helperIsError ? 500 : undefined}
        wordBreak="break-all"
        aria-live="polite"
      >
        {helperMessage || "\u00a0"}
      </Text>
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
  resolvedFieldName,
  label,
  sectionMb,
  useFieldValidate = true,
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

      const kind = classifyAccountInput(value);
      if (kind === "address") {
        return undefined;
      }
      if (kind === "email" || kind === "phone" || kind === "emailInProgress" || kind === "phoneInProgress") {
        return undefined;
      }
      if (allowEns && (kind === "ens" || kind === "ensInProgress")) {
        return undefined;
      }

      return "Invalid address";
    },
    [allowEns, isRequired]
  );

  return (
    <Field
      name={fieldName}
      validate={useFieldValidate ? validateAddress : undefined}
    >
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
          resolvedFieldName={resolvedFieldName}
          label={label}
          sectionMb={sectionMb}
        />
      )}
    </Field>
  );
}

export default AccountField;
