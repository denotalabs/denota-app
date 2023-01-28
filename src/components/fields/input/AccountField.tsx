import { Field } from "formik";

import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";

interface Props {
  fieldName: string;
  placeholder: string;
}

function AccountField({ fieldName, placeholder }: Props) {
  // TODO add address validation
  // function validateAddress(value: string) {
  // }

  return (
    <Field
      name={fieldName}
      // validate={validateAddress}
    >
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <Input {...field} placeholder={placeholder} />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default AccountField;
