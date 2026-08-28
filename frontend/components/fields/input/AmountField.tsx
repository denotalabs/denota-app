import { Field, FieldProps } from "formik";

import {
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  Text,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { FormInputWrap } from "../../designSystem/form/FormInputWrap";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props {
  allowZero?: boolean;
  tokenLabel?: string;
  onMax?: () => void;
}

/** Keep only digits and at most one decimal point. */
function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${head}.${rest.join("")}` : head;
}

function AmountField({ allowZero = false, tokenLabel, onMax }: Props) {
  const [hasStarted, setHasStarted] = useState(false);

  const validateAmount = useCallback(
    (value: number) => {
      setHasStarted(true);
      if (allowZero && value >= 0) {
        return undefined;
      }
      if (value <= 0) {
        return "Value must be greater than 0";
      }
      return undefined;
    },
    [allowZero]
  );

  return (
    <Field name="amount" validate={validateAmount}>
      {({
        field,
        form: { setFieldValue, errors, values, touched },
      }: FieldProps) => {
        const showError = Boolean(
          errors.amount && (hasStarted || touched.amount)
        );

        return (
          <FormControl isInvalid={showError}>
            <FormInputWrap>
              <Input
                variant="unstyled"
                flex={1}
                minW={0}
                h={{ base: "54px", md: "48px" }}
                fontSize={{ base: "17px", md: "15px" }}
                color={formTheme.text}
                inputMode="decimal"
                placeholder="0"
                name={field.name}
                value={values.amount ?? ""}
                onChange={(event) => {
                  setHasStarted(true);
                  setFieldValue(field.name, sanitizeAmount(event.target.value));
                }}
                onBlur={field.onBlur}
              />
              {tokenLabel ? (
                <Text
                  fontSize="14px"
                  color={formTheme.muted}
                  fontWeight={700}
                  flexShrink={0}
                >
                  {tokenLabel}
                </Text>
              ) : null}
              {onMax ? (
                <Button
                  bg={formTheme.primaryButtonBg}
                  color={formTheme.primary}
                  border="none"
                  borderRadius="11px"
                  px={4}
                  py={2.5}
                  fontSize="13px"
                  fontWeight={700}
                  letterSpacing="0.5px"
                  minH={{ base: "44px", md: "36px" }}
                  flexShrink={0}
                  _hover={{ bg: formTheme.cardBgHover }}
                  onClick={onMax}
                >
                  MAX
                </Button>
              ) : null}
            </FormInputWrap>
            <FormErrorMessage>
              {errors.amount && errors.amount.toString()}
            </FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}

export default AmountField;
