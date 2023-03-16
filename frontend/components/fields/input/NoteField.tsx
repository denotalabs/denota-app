import {
  FormControl,
  FormHelperText,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";
import { Field } from "formik";

interface Props {
  fieldName: string;
}

function NoteField({ fieldName }: Props) {
  return (
    <Field
      name={fieldName}
      // validate={validateAddress}
    >
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <FormLabel>Notes</FormLabel>
          <Textarea {...field} />
          <FormHelperText>
            Notes are uploaded to IPFS. Please don't include sensitive data
          </FormHelperText>
        </FormControl>
      )}
    </Field>
  );
}

export default NoteField;
