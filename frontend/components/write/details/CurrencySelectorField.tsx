import {
  Flex,
  FormControl,
  FormErrorMessage,
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
import {
  currencyGlyphs,
  NotaCurrency,
  SUPPORTED_CURRENCIES,
  tokenListSymbolForCurrency,
} from "../../designSystem/CurrencyIcon";
import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";
import { SelectableCardRow } from "../../designSystem/form/SelectableCardRow";

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
          <FormSection label="Select Asset">
            <CurrencySelector
              setFieldValue={setFieldValue}
              value={values.token}
            />
          </FormSection>
          <FormErrorMessage>
            {errors.name && errors.name.toString()}
          </FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

function AssetGlyph({ currency, label }: { currency: NotaCurrency; label: string }) {
  const glyph = currencyGlyphs[currency] ?? {
    color: formTheme.selectedBorder,
    glyph: label.charAt(0),
  };

  return (
    <Flex
      w="30px"
      h="30px"
      borderRadius="full"
      align="center"
      justify="center"
      fontSize="15px"
      fontWeight={700}
      flexShrink={0}
      bg={glyph.color}
      color={glyph.dark ? "#111" : "white"}
    >
      {glyph.glyph}
    </Flex>
  );
}

function CurrencySelector({ setFieldValue, value }: CurrencySelectorProps) {
  const { bySymbol, isLoading } = useTokenList();
  const { displayNameForCurrency: displayName } = useTokens();

  const options = useMemo(() => {
    const available = SUPPORTED_CURRENCIES.filter((currency) =>
      bySymbol.has(normalizeSymbol(tokenListSymbolForCurrency(currency)))
    );
    return available.length > 0 ? available : SUPPORTED_CURRENCIES;
  }, [bySymbol]);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "token",
    value,
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
    <Flex
      direction={{ base: "column", md: "row" }}
      gap={3}
      align="stretch"
      {...group}
    >
      {options.map((option) => {
        const label = displayName(option);
        return (
          <SelectableCardRow
            key={option}
            radioProps={getRadioProps({ value: option })}
            title={label}
            leading={() => <AssetGlyph currency={option} label={label} />}
            flex={{ base: "none", md: 1 }}
            px={{ base: 4, md: 3 }}
            titleFontSize={{ base: "16px", md: "15px" }}
          />
        );
      })}
    </Flex>
  );
}
