import { Field, FieldProps, FormikProps } from "formik";

import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  HStack,
  Input,
  Link,
  Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { Check, Copy, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { blockExplorerAddressUrl } from "../../../context/config/chains";
import { useEnsAddress } from "../../../hooks/useEnsAddress";
import { truncateAddress } from "../../../utils/address";
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
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(copiedTimeout.current);
  }, []);

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

  const copyAddr = (addr: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addr);
    }
    setCopied(true);
    window.clearTimeout(copiedTimeout.current);
    copiedTimeout.current = window.setTimeout(() => setCopied(false), 1400);
  };

  const resolvedAddr =
    currentResolved || resolvedEnsAddress || (isDirectAddress ? trimmed : "");
  const showResolveChip =
    showInteraction &&
    isValidValue &&
    !!resolvedAddr &&
    (ensFound || isDirectAddress);

  const explorerUrl = blockExplorerAddressUrl(
    blockchainState.explorer,
    resolvedAddr
  );

  const content = (
    <>
      <FormInputWrap
        borderState={
          showInteraction && isInvalidValue ? "invalid" : "default"
        }
      >
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
          <Check
            size={20}
            strokeWidth={3}
            color={formTheme.selectedBorder}
            style={{ flexShrink: 0 }}
          />
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
      <Box mt={2.5}>
        {showResolveChip ? (
          <HStack spacing={2} align="center" flexWrap="wrap">
            <Button
              display="inline-flex"
              alignItems="center"
              gap={2}
              px={3}
              py={2}
              h="auto"
              minH="38px"
              borderRadius="10px"
              border="none"
              bg={formTheme.selectedBgMuted}
              color={formTheme.primary}
              fontSize="13px"
              fontWeight={600}
              onClick={() => copyAddr(resolvedAddr)}
            >
              <span>{truncateAddress(resolvedAddr)}</span>
              {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
            </Button>
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
              aria-label="View on block explorer"
            >
              <ExternalLinkIcon boxSize={3.5} />
            </Link>
          </HStack>
        ) : null}
        {showInteraction && isInvalidValue ? (
          <Text
            display="block"
            fontSize="13px"
            color={formTheme.error}
            fontWeight={500}
          >
            Not a valid ENS name or 0x address
          </Text>
        ) : null}
        {form.errors[fieldName] &&
          showInteraction &&
          !ensFound &&
          !isInvalidValue ? (
          <FormControl isInvalid>
            <FormErrorMessage>
              {form.errors[fieldName] as string}
            </FormErrorMessage>
          </FormControl>
        ) : null}
      </Box>
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
