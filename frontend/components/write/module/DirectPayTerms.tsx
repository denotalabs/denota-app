import { Checkbox, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { Field, FieldProps } from "formik";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import useDemoMode from "../../../hooks/useDemoMode";

export function DirectPayTerms() {
  const isDemoMode = useDemoMode();

  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  return (
    <Flex flexWrap={"wrap"} direction={"column"}>
      <Text fontSize="lg" mb={5} fontWeight={600}>
        {"Funds will be released immediately upon payment."}
      </Text>
      <Stack spacing={5}>
        {/* Axelar only supported for Celo direct payments */}
        {isDemoMode &&
          notaFormValues.mode === "pay" &&
          blockchainState.chainId === "0xaef3" && (
            <HStack spacing={5}>
              <Field name="axelarEnabled">
                {({ field }: FieldProps) => (
                  <Checkbox defaultChecked={field.value} {...field}>
                    <Text fontSize="lg" color="notaPurple.100">
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
