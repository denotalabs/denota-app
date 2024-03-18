import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { Field, FieldProps } from "formik";

import { useTokens } from "../../../hooks/useTokens";
import CurrencyIcon, { NotaCurrency } from "../../designSystem/CurrencyIcon";
import { TokenChoice } from "../../designSystem/TokenChoice";

interface CurrencySelectorProps {
  setFieldValue: (field: string, value: NotaCurrency) => void;
  value: NotaCurrency;
}

// TODO need to add arbitrary token support (like uni by entering it's address)
export function CurrencySelectorField() {
  return (
    <Field name="token">
      {({ form: { errors, touched, setFieldValue, values } }: FieldProps) => (
        <FormControl
          maxW="100%"
          isInvalid={Boolean(errors.name && touched.name)}
        >
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

function CurrencySelector({ setFieldValue, value }: CurrencySelectorProps) {
  const options: NotaCurrency[] = ["USDT", "USDC", "USDCE", "WETH"];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "framework",
    defaultValue: value,
    onChange: (val: NotaCurrency) => {
      setFieldValue("token", val);
    },
  });

  const { displayNameForCurrency } = useTokens();

  const group = getRootProps();
  return (
    <HStack flexWrap="wrap" {...group} maxW="100%" rowGap={3}>
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
