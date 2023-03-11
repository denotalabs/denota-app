import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";
import { Field } from "formik";

interface Props {
  fieldName: string;
  placeholder: string;
}

export default function TagsField({ fieldName, placeholder }: Props) {
  return (
    <Field
      name={fieldName}
      // validate={validateAddress}
    >
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <FormLabel mb={0} noOfLines={1} flexShrink={0}>
            Tags
          </FormLabel>
          <FormHelperText mt={0} mb={2}>
            <Text as="i">Add tags separated by commas (optional)</Text>
          </FormHelperText>{" "}
          <Input {...field} />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}
