import { QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Tooltip,
} from "@chakra-ui/react";
import { Field } from "formik";

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
            {tooltipLabel ? (
              <Tooltip
                label={tooltipLabel}
                aria-label="field tooltip"
                placement="right"
              >
                <QuestionOutlineIcon ml={2} mb={1} />
              </Tooltip>
            ) : null}
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
