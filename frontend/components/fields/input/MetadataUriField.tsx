import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Input,
} from "@chakra-ui/react";
import { useField } from "formik";
import { useEffect, useRef, useState } from "react";
import { FileUploadButton } from "../../write/metadata/FileUpload";
import { FormInputWrap } from "../../designSystem/form/FormInputWrap";
import { formTheme } from "../../designSystem/form/formTheme";
import {
  IpfsVerificationStatus,
  metadataUriHelperText,
  metadataUriNeedsNormalization,
  parseMetadataUri,
  verifyIpfsAvailability,
} from "../../../utils/metadataUri";

type UploadValueKey = "imageURI" | "ipfsHash";

interface Props {
  fieldName: string;
  placeholder: string;
  uploadValueKey?: UploadValueKey;
}

export default function MetadataUriField({
  fieldName,
  placeholder,
  uploadValueKey = "imageURI",
}: Props) {
  const [field, meta, helpers] = useField(fieldName);
  const [verification, setVerification] =
    useState<IpfsVerificationStatus>("idle");
  const verifyRequestId = useRef(0);

  const parsed = parseMetadataUri(field.value ?? "");
  const showHelper = meta.touched && !!field.value?.trim();
  const helperText = showHelper
    ? metadataUriHelperText(parsed, verification, field.value ?? "")
    : undefined;

  useEffect(() => {
    const trimmed = field.value?.trim() ?? "";
    const currentParsed = parseMetadataUri(trimmed);

    if (!meta.touched || !trimmed || !currentParsed.cid) {
      setVerification("idle");
      return;
    }

    const requestId = ++verifyRequestId.current;
    setVerification("checking");

    verifyIpfsAvailability(currentParsed.normalized).then((available) => {
      if (requestId !== verifyRequestId.current) {
        return;
      }
      setVerification(available ? "found" : "missing");
    });

    return () => {
      verifyRequestId.current += 1;
    };
  }, [field.value, meta.touched]);

  useEffect(() => {
    if (!meta.touched) {
      return;
    }
    const trimmed = field.value?.trim() ?? "";
    if (!trimmed || !metadataUriNeedsNormalization(trimmed)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const nextParsed = parseMetadataUri(trimmed);
      if (nextParsed.normalized !== trimmed) {
        helpers.setValue(nextParsed.normalized);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [field.value, helpers, meta.touched]);

  const commitNormalizedValue = () => {
    const trimmed = field.value?.trim();
    if (!trimmed) {
      return;
    }
    const nextParsed = parseMetadataUri(trimmed);
    if (nextParsed.normalized !== trimmed) {
      helpers.setValue(nextParsed.normalized);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    field.onBlur(event);
    commitNormalizedValue();
  };

  return (
    <FormControl isInvalid={!!meta.error && meta.touched}>
      <FormInputWrap>
        <Input
          flex={1}
          minW={0}
          variant="unstyled"
          h={{ base: "54px", md: "48px" }}
          fontSize={{ base: "17px", md: "15px" }}
          color={formTheme.text}
          autoCapitalize="none"
          spellCheck={false}
          {...field}
          placeholder={placeholder}
          onBlur={handleBlur}
        />
        <FileUploadButton
          name={fieldName}
          uploadValueKey={uploadValueKey}
        />
      </FormInputWrap>
      {helperText ? (
        <FormHelperText
          mt={2}
          fontSize="13px"
          color={
            verification === "missing" ? "orange.300" : formTheme.muted
          }
        >
          {helperText}
        </FormHelperText>
      ) : null}
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  );
}
