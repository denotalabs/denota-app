import { Field, FieldProps, FormikProps } from "formik";

import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Input, Link, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { blockExplorerAddressUrl } from "../../../context/config/chains";
import { useEnsAddress } from "../../../hooks/useEnsAddress";
import {
  couldBeEnsInProgress,
  isEnsName,
} from "../../../utils/ensAddress";
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
}

interface InnerProps extends Props {
  field: FieldProps["field"];
  form: FormikProps<{ [key: string]: string }>;
  touched: boolean;
  hasStarted: boolean;
  onInputStarted: () => void;
}

function getEnsResolutionError(
  value: string,
  allowEns: boolean,
  isEnsLoading: boolean,
  resolvedEnsAddress: string | null | undefined
): string | undefined {
  if (!allowEns || !isEnsName(value)) {
    return undefined;
  }
  if (isEnsLoading) {
    return undefined;
  }
  if (resolvedEnsAddress === null) {
    return "Invalid address";
  }
  return undefined;
}

function getResolvedFieldValue(
  inputValue: string,
  resolvedEnsAddress: string | null | undefined
): string {
  if (ethers.utils.isAddress(inputValue)) {
    return "";
  }
  if (isEnsName(inputValue) && resolvedEnsAddress) {
    return resolvedEnsAddress;
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
  resolvedFieldName,
  label,
  sectionMb,
}: InnerProps) {
  const { setFieldValue, setFieldError, values } = form;
  const { blockchainState } = useBlockchainData();
  const currentResolved = resolvedFieldName
    ? (values[resolvedFieldName] ?? "")
    : "";

  const { address: resolvedEnsAddress, isLoading: isEnsLoading } =
    useEnsAddress(
      allowEns && isEnsName(field.value) ? field.value : undefined
    );

  const ensResolutionError = useMemo(
    () =>
      getEnsResolutionError(
        field.value,
        allowEns,
        isEnsLoading,
        resolvedEnsAddress
      ),
    [allowEns, field.value, isEnsLoading, resolvedEnsAddress]
  );

  useEffect(() => {
    if (!allowEns || !isEnsName(field.value)) {
      return;
    }
    setFieldError(fieldName, ensResolutionError);
  }, [
    allowEns,
    ensResolutionError,
    field.value,
    fieldName,
    setFieldError,
  ]);

  useEffect(() => {
    if (!allowEns || !resolvedFieldName) {
      return;
    }

    const nextResolved = getResolvedFieldValue(field.value, resolvedEnsAddress);
    if (currentResolved !== nextResolved) {
      setFieldValue(resolvedFieldName, nextResolved, false);
    }
  }, [
    allowEns,
    currentResolved,
    field.value,
    resolvedEnsAddress,
    resolvedFieldName,
    setFieldValue,
  ]);

  const ensFound =
    allowEns &&
    isEnsName(field.value) &&
    !isEnsLoading &&
    !!resolvedEnsAddress;

  const trimmed = field.value?.trim() ?? "";
  const isDirectAddress = ethers.utils.isAddress(trimmed);
  const isEmpty = trimmed.length === 0;

  const isValidValue = !isEmpty && (isDirectAddress || ensFound);
  const isInvalidValue =
    !isEmpty &&
    !isDirectAddress &&
    !ensFound &&
    !isEnsLoading &&
    !(allowEns && couldBeEnsInProgress(trimmed));

  const showInteraction = touched || hasStarted;

  const resolvedAddr =
    currentResolved || resolvedEnsAddress || (isDirectAddress ? trimmed : "");
  const displayResolvedAddr =
    resolvedAddr && ethers.utils.isAddress(resolvedAddr)
      ? ethers.utils.getAddress(resolvedAddr)
      : resolvedAddr;
  const showResolvedHelper =
    showInteraction && ensFound && !!displayResolvedAddr;
  const formError =
    showInteraction && !ensFound && !isInvalidValue
      ? (form.errors[fieldName] as string | undefined)
      : undefined;
  const helperMessage = showResolvedHelper
    ? displayResolvedAddr
    : showInteraction && isInvalidValue
      ? "Not a valid ENS name or 0x address"
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

      if (ethers.utils.isAddress(value)) {
        return undefined;
      }

      if (allowEns && (isEnsName(value) || couldBeEnsInProgress(value))) {
        return undefined;
      }

      return "Invalid address";
    },
    [allowEns, isRequired]
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
          resolvedFieldName={resolvedFieldName}
          label={label}
          sectionMb={sectionMb}
        />
      )}
    </Field>
  );
}

export default AccountField;
