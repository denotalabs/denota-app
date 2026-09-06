import { Field, FieldProps } from "formik";

import { Button, FormControl, Input } from "@chakra-ui/react";
import { useCallback } from "react";
import { FormInputWrap } from "../../designSystem/form/FormInputWrap";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props {
  allowZero?: boolean;
  /** Max fraction digits accepted, per the selected token. */
  decimals?: number;
  onMax?: () => void;
  invalid?: boolean;
}

/** Keep only digits and at most one decimal point, capped at `decimals` places. */
function sanitizeAmount(raw: string, decimals: number): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  if (rest.length === 0) {
    return head;
  }
  if (decimals <= 0) {
    return head;
  }
  return `${head}.${rest.join("").slice(0, decimals)}`;
}

function AmountField({
  allowZero = false,
  decimals = 18,
  onMax,
  invalid = false,
}: Props) {
  const validateAmount = useCallback(
    (value: number) => {
      if (allowZero && value >= 0) {
        return undefined;
      }
      if (value <= 0) {
        return "Amount must be greater than 0";
      }
      return undefined;
    },
    [allowZero]
  );

  return (
    <Field name="amount" validate={validateAmount}>
      {({ field, form: { setFieldValue, values } }: FieldProps) => (
        <FormControl isInvalid={invalid}>
          <FormInputWrap borderState={invalid ? "invalid" : "default"}>
            <Input
              variant="unstyled"
              flex={1}
              minW={0}
              h={{ base: "54px", md: "48px" }}
              fontSize={{ base: "20px", md: "18px" }}
              fontWeight={600}
              color={formTheme.text}
              inputMode="decimal"
              placeholder="0"
              name={field.name}
              value={values.amount ?? ""}
              aria-invalid={invalid}
              aria-describedby={invalid ? "amount-hint" : undefined}
              onChange={(event) => {
                setFieldValue(
                  field.name,
                  sanitizeAmount(event.target.value, decimals)
                );
              }}
              onBlur={field.onBlur}
            />
            {onMax ? (
              <Button
                variant="link"
                color={formTheme.primary}
                fontSize="13px"
                fontWeight={700}
                letterSpacing="0.5px"
                minW="auto"
                h="auto"
                px={1}
                flexShrink={0}
                _hover={{ textDecoration: "none", color: "notaPurple.100" }}
                onClick={onMax}
              >
                MAX
              </Button>
            ) : null}
          </FormInputWrap>
        </FormControl>
      )}
    </Field>
  );
}

export default AmountField;
