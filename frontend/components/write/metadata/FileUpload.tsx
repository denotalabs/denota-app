import { ButtonProps, IconButton, useToast } from "@chakra-ui/react";
import { useField } from "formik";
import React, { ChangeEvent, useRef, useState } from "react";
import { BsUpload } from "react-icons/bs";
import { useUploadMetadata } from "../../../hooks/useUploadNote";
import { normalizeMetadataUri } from "../../../utils/metadataUri";

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
        variant="outline"
        aria-label="Upload"
        flexShrink={0}
        icon={<BsUpload />}
        isLoading={isLoading}
        onClick={handleClick}
        {...buttonProps}
      />
    </>
  );
}

export default FileUploadButton;
