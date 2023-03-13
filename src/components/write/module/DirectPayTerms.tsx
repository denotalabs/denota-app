import { QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { Field, useFormikContext } from "formik";
import { useEffect } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { PaymentTermsFormValues } from "./PaymentTermsStep";

interface Props {
  isInvoice: boolean;
}

export function DirectPayTerms({ isInvoice }: Props) {
  const { values } = useFormikContext<PaymentTermsFormValues>();
  const { appendFormData } = useNotaForm();

  useEffect(() => {
    appendFormData({ dueDate: values.dueDate });
  }, [appendFormData, values.dueDate]);

  return (
    <Flex flexWrap={"wrap"} direction={"column"}>
      <Text fontSize="lg" mb={5} fontWeight={600}>
        {"Funds will be released immediately upon payment"}
      </Text>
      {isInvoice && (
        <Field
          name="dueDate"
          // validate={validateAmount}
        >
          {({ field, form: { errors, touched } }: any) => (
            <FormControl isInvalid={errors.name && touched.name}>
              <FormLabel noOfLines={1} flexShrink={0} mb={3}>
                Due date
                <Tooltip
                  label="Date the payment is due"
                  aria-label="module tooltip"
                  placement="right"
                >
                  <QuestionOutlineIcon ml={2} mb={1} />
                </Tooltip>
              </FormLabel>
              <Input type="date" w="200px" {...field} />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>
          )}
        </Field>
      )}
    </Flex>
  );
}
