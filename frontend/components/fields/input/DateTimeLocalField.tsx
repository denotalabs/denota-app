import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { Field } from "formik";
import InfoTooltip from "../../designSystem/InfoTooltip";

interface Props {
  fieldName: string;
  label: string;
  helperText?: string;
  tooltipLabel?: string;
}

function DateTimeLocalField({
  fieldName,
  label,
  helperText,
  tooltipLabel,
}: Props) {
  return (
    <Field name={fieldName}>
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors[fieldName] && touched[fieldName]}>
          <FormLabel noOfLines={1} flexShrink={0}>
            {label}
            {tooltipLabel ? <InfoTooltip label={tooltipLabel} /> : null}
          </FormLabel>
          <Input type="datetime-local" step={1} {...field} />
          {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
          <FormErrorMessage>{errors[fieldName]}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default DateTimeLocalField;
