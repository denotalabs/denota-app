import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import { Field } from "formik";
import RoundedBox from "../../designSystem/RoundedBox";

function CurrencySelector() {
  return (
    <RoundedBox padding={4} mb={6}>
      <Field name="token">
        {({ field, form: { errors, touched } }: any) => (
          <FormControl isInvalid={errors.name && touched.name}>
            <FormLabel mb={2}>Select Asset</FormLabel>

            <RadioGroup {...field}>
              <Stack spacing={4} direction="row">
                {["DAI", "WETH"].map((value) => (
                  <div key={value}>
                    <Radio {...field} value={value}>
                      {value}
                    </Radio>
                  </div>
                ))}
              </Stack>
            </RadioGroup>
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>
        )}
      </Field>
    </RoundedBox>
  );
}

export default CurrencySelector;
