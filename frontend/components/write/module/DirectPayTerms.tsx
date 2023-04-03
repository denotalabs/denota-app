import { QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { Field, FieldProps } from "formik";
import { ChangeEvent, useState } from "react";

interface Props {
  isInvoice: boolean;
}

export function DirectPayTerms({ isInvoice }: Props) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  return (
    <Flex flexWrap={"wrap"} direction={"column"}>
      <Text fontSize="lg" mb={5} fontWeight={600}>
        {"Funds will be released immediately upon payment."}
      </Text>
      <Stack spacing={5}>
        {isInvoice && (
          <Field name="dueDate">
            {({ field, form: { errors, touched } }: FieldProps) => (
              <FormControl isInvalid={Boolean(errors.name && touched.name)}>
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
                <FormErrorMessage>
                  {errors.name && errors.name.toString()}
                </FormErrorMessage>
              </FormControl>
            )}
          </Field>
        )}
        <HStack spacing={5}>
          <Checkbox
            isChecked={isChecked}
            colorScheme="blue"
            onChange={handleCheckboxChange}
          >
            <Text fontSize={"lg"}>Mint cross-chain on Polygon with Axelar</Text>
          </Checkbox>
        </HStack>
      </Stack>
    </Flex>
  );
}
