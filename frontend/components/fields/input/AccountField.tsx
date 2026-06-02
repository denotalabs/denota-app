import { Field, FieldProps, FormikProps } from "formik";

import { FormControl, FormErrorMessage, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEnsAddress } from "../../../hooks/useEnsAddress";
import {
  couldBeEnsInProgress,
  isEnsName,
} from "../../../utils/ensAddress";

interface Props {
  fieldName: string;
  placeholder: string;
  isRequired?: boolean;
  allowEns?: boolean;
  resolvedFieldName?: string;
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
}: InnerProps) {
  const { setFieldValue, setFieldError, values } = form;
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

  const fieldError = form.errors[fieldName] as string | undefined;
  const showError = Boolean(fieldError && (touched || hasStarted) && !ensFound);

  return (
    <FormControl isInvalid={showError}>
      <Input
        {...field}
        placeholder={placeholder}
        onChange={(event) => {
          if (event.target.value !== "") {
            onInputStarted();
          }
          field.onChange(event);
        }}
      />
      {ensFound ? (
        <Text color="green.500" fontSize="sm" mt={1}>
          ENS name found
        </Text>
      ) : (
        <FormErrorMessage>{fieldError}</FormErrorMessage>
      )}
    </FormControl>
  );
}

function AccountField({
  fieldName,
  placeholder,
  isRequired = true,
  allowEns = false,
  resolvedFieldName,
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
        />
      )}
    </Field>
  );
}

export default AccountField;
