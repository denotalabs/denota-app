import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { Field, FieldProps } from "formik";

import { useCurrencyDisplayName } from "../../../hooks/useCurrencyDisplayName";
import CurrencyIcon, { CheqCurrency } from "../../designSystem/CurrencyIcon";
import { TokenChoice } from "../../designSystem/TokenChoice";

interface CurrencySelectorProps {
  setFieldValue: (field: string, value: CheqCurrency) => void;
  value: CheqCurrency;
}

export function CurrencySelectorField() {
  return (
    <Field name="token">
      {({ form: { errors, touched, setFieldValue, values } }: FieldProps) => (
        <FormControl isInvalid={Boolean(errors.name && touched.name)}>
          <FormLabel mb={2}>Select Asset</FormLabel>
          <CurrencySelector
            setFieldValue={setFieldValue}
            value={values.token}
          />
          <FormErrorMessage>
            {errors.name && errors.name.toString()}
          </FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

function CurrencySelector({
  setFieldValue,
  value,
}: CurrencySelectorProps) {
  const options: CheqCurrency[] = ["NATIVE", "DAI", "WETH"];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "framework",
    defaultValue: value,
    onChange: (val: CheqCurrency) => {
      setFieldValue("token", val);
    },
  });

  const { displayNameForCurrency } = useCurrencyDisplayName();

  const group = getRootProps();
  return (
    <HStack {...group}>
      {options.map((value) => {
        const radio = getRadioProps({ value });
        return (
          <TokenChoice key={value} radioProps={radio}>
            <HStack>
              <CurrencyIcon currency={value} />
              <Text fontSize="sm" textAlign="center">
                {displayNameForCurrency(value)}
              </Text>
            </HStack>
          </TokenChoice>
        );
      })}
    </HStack>
  );
}
