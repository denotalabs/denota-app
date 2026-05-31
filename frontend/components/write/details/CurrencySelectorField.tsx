import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Spinner,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { Field, FieldProps } from "formik";

import { useMemo } from "react";
import {
  normalizeSymbol,
  useTokenList,
} from "../../../context/TokenListProvider";
import { useTokens } from "../../../hooks/useTokens";
import CurrencyIcon, {
  NotaCurrency,
  SUPPORTED_CURRENCIES,
} from "../../designSystem/CurrencyIcon";
import { TokenChoice } from "../../designSystem/TokenChoice";

interface CurrencySelectorProps {
  setFieldValue: (field: string, value: NotaCurrency) => void;
  value: NotaCurrency;
}

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
  const { bySymbol, isLoading } = useTokenList();
  const { displayNameForCurrency } = useTokens();

  // Only show currencies that resolve to a token on the active chain.
  const options = useMemo(() => {
    const available = SUPPORTED_CURRENCIES.filter((currency) =>
      bySymbol.has(normalizeSymbol(currency))
    );
    return available.length > 0 ? available : SUPPORTED_CURRENCIES;
  }, [bySymbol]);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "framework",
    defaultValue: value,
    onChange: (val: NotaCurrency) => {
      setFieldValue("token", val);
    },
  });

  const group = getRootProps();

  if (isLoading) {
    return (
      <HStack maxW="100%">
        <Spinner size="sm" />
        <Text fontSize="sm">Loading tokens...</Text>
      </HStack>
    );
  }

  return (
    <HStack flexWrap="wrap" {...group} maxW="100%" rowGap={3}>
      {options.map((option) => {
        const radio = getRadioProps({ value: option });
        return (
          <TokenChoice key={option} radioProps={radio}>
            <HStack>
              <CurrencyIcon currency={option} />
              <Text fontSize="sm" textAlign="center">
                {displayNameForCurrency(option)}
              </Text>
            </HStack>
          </TokenChoice>
        );
      })}
    </HStack>
  );
}
