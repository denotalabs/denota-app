import { ArrowUpIcon } from "@chakra-ui/icons";
import {
  Button,
  ButtonProps,
  FormControl,
  FormControlProps,
  FormLabel,
  InputGroup,
} from "@chakra-ui/react";
import { useField } from "formik";
import React, { ChangeEvent, ForwardedRef, useRef, useState } from "react";
import OptionalFieldHelperText from "../../fields/input/OptionFieldHelperText";

type FileUploadProps = {
  accept?: string;
  multiple?: boolean;
  name: string;
};

export type FileControlProps = FormControlProps &
  FileUploadProps & { buttonProps?: ButtonProps };

export const FileControl: React.FC<FileControlProps> = React.forwardRef(
  (props: FileControlProps, ref: ForwardedRef<HTMLInputElement>) => {
    const {
      name,
      label,
      buttonProps,
      multiple = false,
      accept = ".jpg,.jpeg,.png,.gif",
      ...rest
    } = props;
    const [{ onChange, ...field }, , { setValue }] = useField(name);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleChange = (value: ChangeEvent<HTMLInputElement>) => {
      setFileName(value.target.files?.[0].name);
      console.log(value.target.files?.[0]);
      value.target.files && setValue(value.target.files?.[0]);
    };

    const [fileName, setFileName] = useState<string | undefined>();

    return (
      <FormControl name={name} label={label} {...rest} {...ref}>
        <FormLabel noOfLines={1} flexShrink={0} mb={0}>
          Attach File
        </FormLabel>
        <OptionalFieldHelperText />
        <InputGroup onClick={handleClick}>
          <input
            onChange={handleChange}
            type="file"
            accept={accept}
            multiple={multiple}
            id={name}
            ref={inputRef}
            hidden
          />
          <Button
            w={"full"}
            variant={"outline"}
            {...buttonProps}
            {...field}
            leftIcon={fileName ? undefined : <ArrowUpIcon />}
            isLoading={false}
            paddingX={24}
          >
            {fileName ? fileName : "Upload"}
          </Button>
        </InputGroup>
      </FormControl>
    );
  }
);

export default FileControl;
