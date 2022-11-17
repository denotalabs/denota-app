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

function CurrencySelector() {
  return (
    <Box borderRadius={10} padding={4} mb={6} bg="gray.700" w="100%">
      <Field name="token">
        {({ field, form: { errors, touched } }: any) => (
          <FormControl isInvalid={errors.name && touched.name}>
            <FormLabel mb={2}>Select Asset</FormLabel>

            <RadioGroup {...field}>
              <Stack spacing={4} direction="row">
                {["ETH", "WBTC", "USDC"].map((value) => (
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
    </Box>
  );
}

export default CurrencySelector;
