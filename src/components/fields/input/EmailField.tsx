import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { Field } from "formik";
import OptionalFieldHelperText from "./OptionFieldHelperText";

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
          <FormLabel mb={0} noOfLines={1} flexShrink={0}>
            Client Email
          </FormLabel>
          <OptionalFieldHelperText />
          <Input {...field} />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}
