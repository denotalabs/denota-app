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

export default function ImageUrlField({ fieldName, placeholder }: Props) {
  return (
    <Field
      name={fieldName}
      // validate={validateAddress}
    >
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <FormLabel noOfLines={1} flexShrink={0}>
            Image URL
          </FormLabel>
          <Input {...field} />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}
