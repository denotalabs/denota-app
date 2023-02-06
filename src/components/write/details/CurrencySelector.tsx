import { ReactNode } from "react";

import { Field } from "formik";

import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Text,
  useRadio,
  useRadioGroup,
  UseRadioProps,
} from "@chakra-ui/react";

import CurrencyIcon, { CheqCurrency } from "../../designSystem/CurrencyIcon";
import RoundedBox from "../../designSystem/RoundedBox";

function CurrencySelector() {
  return (
    <RoundedBox padding={4} mb={6}>
      <Field name="token">
        {({ field, form: { errors, touched, setFieldValue, values } }: any) => (
          <FormControl isInvalid={errors.name && touched.name}>
            <FormLabel mb={2}>Select Asset</FormLabel>

            <CurrencySelectorInner
              setFieldValue={setFieldValue}
              value={values.token}
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>
        )}
      </Field>
    </RoundedBox>
  );
}

interface CurrencySelectorInnerProps {
  setFieldValue: any;
  value: string;
}

function CurrencySelectorInner({
  setFieldValue,
  value,
}: CurrencySelectorInnerProps) {
  const options: CheqCurrency[] = ["DAI", "WETH"];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "framework",
    defaultValue: value,
    onChange: (val) => {
      setFieldValue("token", val);
    },
  });

  const group = getRootProps();
  return (
    <HStack {...group}>
      {options.map((value) => {
        const radio = getRadioProps({ value });
        return (
          <RadioCard key={value} radioProps={radio}>
            <HStack>
              <CurrencyIcon currency={value} />
              <Text fontSize="sm" textAlign="center">
                {value}
              </Text>
            </HStack>
          </RadioCard>
        );
      })}
    </HStack>
  );
}

interface RadioCardProps {
  children: ReactNode;
  radioProps: UseRadioProps;
}

function RadioCard({ radioProps, children }: RadioCardProps) {
  const { getInputProps, getCheckboxProps } = useRadio(radioProps);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="full"
        boxShadow="md"
        _checked={{
          bg: "teal.600",
          color: "white",
          borderColor: "teal.600",
        }}
        p={2}
      >
        {children}
      </Box>
    </Box>
  );
}

export default CurrencySelector;
