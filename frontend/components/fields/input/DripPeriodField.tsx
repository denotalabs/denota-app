import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Field, FieldProps, useFormikContext } from "formik";
import {
  DRIP_PERIOD_PRESETS,
  DRIP_PERIOD_UNITS,
  DripPeriodFormValues,
} from "../../../utils/dripPeriod";

interface Props {
  helperText?: string;
}

function DripPeriodField({ helperText }: Props) {
  const { errors, touched, values, setFieldValue } =
    useFormikContext<DripPeriodFormValues & Record<string, string>>();
  const showError = Boolean(
    errors.dripPeriod &&
    (touched.dripPeriodPreset ||
      touched.dripPeriodAmount ||
      touched.dripPeriodUnit)
  );

  return (
    <FormControl isInvalid={showError}>
      <FormLabel>Drip period:</FormLabel>
      <Field name="dripPeriodPreset">
        {({ field }: FieldProps) => (
          <RadioGroup
            value={field.value}
            onChange={(val) => setFieldValue("dripPeriodPreset", val)}
          >
            <Stack spacing={2}>
              {DRIP_PERIOD_PRESETS.map(({ value, label }) => (
                <Radio key={value} value={value}>
                  <Text as="span" fontWeight={500}>
                    {label}
                  </Text>
                </Radio>
              ))}
              <Radio value="custom">
                <Text as="span" fontWeight={500}>
                  Custom
                </Text>
              </Radio>
            </Stack>
          </RadioGroup>
        )}
      </Field>

      {values.dripPeriodPreset === "custom" && (
        <Box mt={4}>
          <HStack align="flex-end" spacing={3} flexWrap="wrap">
            <FormControl flex={1} minW="100px">
              <FormLabel fontSize="sm" mb={1}>
                Every
              </FormLabel>
              <Field name="dripPeriodAmount">
                {({ field, form: { setFieldValue: setVal } }: FieldProps) => (
                  <NumberInput
                    min={1}
                    step={1}
                    value={values.dripPeriodAmount ?? "1"}
                    onChange={(val) => setVal("dripPeriodAmount", val)}
                  >
                    <NumberInputField {...field} />
                  </NumberInput>
                )}
              </Field>
            </FormControl>
            <FormControl flex={1} minW="140px">
              <FormLabel fontSize="sm" mb={1}>
                Unit
              </FormLabel>
              <Field name="dripPeriodUnit">
                {({ field }: FieldProps) => (
                  <Select {...field}>
                    {DRIP_PERIOD_UNITS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </FormControl>
          </HStack>
        </Box>
      )}

      {helperText ? <FormHelperText mt={2}>{helperText}</FormHelperText> : null}
      <FormErrorMessage>{errors.dripPeriod?.toString()}</FormErrorMessage>
    </FormControl>
  );
}

export default DripPeriodField;
