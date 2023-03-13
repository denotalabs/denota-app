import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { Field } from "formik";

interface Props {
  fieldName: string;
  placeholder: string;
}

export default function EmailField({ fieldName, placeholder }: Props) {
  return (
    <Field
      name={fieldName}
      // validate={validateAddress}
    >
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <FormLabel noOfLines={1} flexShrink={0}>
            Client Email
          </FormLabel>
          <Input {...field} />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}
