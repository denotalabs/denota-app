import { Field } from "formik";

import { FormControl, FormErrorMessage, Select } from "@chakra-ui/react";

// TODO - make extensible to support only tokens in wallet, etc
function TokenField() {
  // TODO validate function (could check user wallet)
  return (
    <Field
      name="token"
      // validate={validateToken}
    >
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.token && touched.token}>
          <Select {...field}>
            {/* TODO limit options by what is actually selectable */}
            <option value="dai">DAI</option>
            <option value="weth">WETH</option>
          </Select>
          <FormErrorMessage>{errors.token}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default TokenField;
