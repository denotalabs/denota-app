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
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import useDemoMode from "../../../hooks/useDemoMode";

interface Props {
  isInvoice: boolean;
}

export function DirectPayTerms({ isInvoice }: Props) {
  const isDemoMode = useDemoMode();

  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

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
        {/* Axelar only supported for Celo direct payments */}
        {isDemoMode &&
          notaFormValues.mode === "pay" &&
          blockchainState.chainId === "0xaef3" && (
            <HStack spacing={5}>
              <Field name="axelarEnabled">
                {({ field }: FieldProps) => (
                  <Checkbox defaultChecked={field.value} {...field}>
                    <Text fontSize="lg" color="cheqPurple.100">
                      Mint cross-chain on Polygon with Axelar
                    </Text>
                  </Checkbox>
                )}
              </Field>
            </HStack>
          )}
      </Stack>
    </Flex>
  );
}
