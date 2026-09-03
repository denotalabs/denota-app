import { ButtonProps, IconButton, useToast } from "@chakra-ui/react";
import { useField } from "formik";
import { Upload } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { useUploadMetadata } from "../../../hooks/useUploadNote";
import { normalizeMetadataUri } from "../../../utils/metadataUri";
import { formTheme } from "../../designSystem/form/formTheme";

type UploadValueKey = "imageURI" | "ipfsHash";

type FileUploadButtonProps = {
  name: string;
  accept?: string;
  multiple?: boolean;
  buttonProps?: ButtonProps;
  uploadValueKey?: UploadValueKey;
};

export function FileUploadButton({
  name,
  buttonProps,
  multiple = false,
  accept = ".jpg,.jpeg,.png,.gif,.pdf,.docx,.csv",
  uploadValueKey = "imageURI",
}: FileUploadButtonProps) {
  const [, , { setValue, setTouched }] = useField(name);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const { upload } = useUploadMetadata();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (value: ChangeEvent<HTMLInputElement>) => {
    if (value.target.files?.[0] && value.target.files?.[0].size < 5000000) {
      setIsLoading(true);
      const { imageURI, ipfsHash } = await upload(
        value.target.files?.[0],
        undefined,
        undefined
      );
      const uploadedValue = normalizeMetadataUri(
        uploadValueKey === "ipfsHash" ? ipfsHash : imageURI
      );
      if (!uploadedValue) {
        toast({
          title: "Upload error",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        setValue(uploadedValue);
        setTouched(true, false);
      }
      setIsLoading(false);
    } else {
      toast({
        title: "File too large (max size 5MB)",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <input
        onChange={handleChange}
        type="file"
        accept={accept}
        multiple={multiple}
        id={name}
        ref={inputRef}
        hidden
      />
      <IconButton
        variant="unstyled"
        aria-label="Upload"
        flexShrink={0}
        alignSelf="center"
        display="flex"
        alignItems="center"
        justifyContent="center"
        icon={<Upload size={18} strokeWidth={2} />}
        isLoading={isLoading}
        onClick={handleClick}
        bg={formTheme.primaryButtonBg}
        color={formTheme.primary}
        border="none"
        borderRadius="11px"
        w="44px"
        h="44px"
        minW="44px"
        minH="44px"
        p={0}
        lineHeight={0}
        _hover={{ bg: formTheme.cardBgHover }}
        {...buttonProps}
      />
    </>
  );
}

export default FileUploadButton;
