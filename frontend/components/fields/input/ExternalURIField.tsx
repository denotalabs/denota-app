import { FormControl, FormErrorMessage, HStack, Input } from "@chakra-ui/react";
import { Field } from "formik";
import { FileUploadButton } from "../../write/metadata/FileUpload";

interface Props {
  fieldName: string;
  placeholder: string;
}

export default function ExternalURIField({ fieldName, placeholder }: Props) {
  return (
    <Field name={fieldName}>
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <HStack align="center" spacing={2}>
            <Input flex={1} {...field} placeholder={placeholder} />
            <FileUploadButton name={fieldName} uploadValueKey="ipfsHash" />
          </HStack>
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}
