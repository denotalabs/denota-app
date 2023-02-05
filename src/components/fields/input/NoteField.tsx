import {
  FormControl,
  FormHelperText,
  FormLabel,
  Textarea,
} from "@chakra-ui/react";
import { Field } from "formik";
import OptionalFieldHelperText from "./OptionFieldHelperText";

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
          <FormLabel mb={0}>Notes</FormLabel>
          <OptionalFieldHelperText />
          <Textarea {...field} />
          <FormHelperText>
            Notes are uploaded to IPFS. Please don't inlcude sensitive data
          </FormHelperText>
        </FormControl>
      )}
    </Field>
  );
}

export default NoteField;
