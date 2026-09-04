import { Box, Flex, FormControl, Text, useRadioGroup } from "@chakra-ui/react";
import { Field, FieldProps, useFormikContext } from "formik";
import { List, Receipt, Send } from "lucide-react";
import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";
import { SelectableCardRow } from "../../designSystem/form/SelectableCardRow";

export type PaymentType = "sendOnly" | "withReceipt" | "withTerms";

const PAYMENT_TYPE_OPTIONS: {
  value: PaymentType;
  label: string;
  description: string;
  icon: typeof List;
}[] = [
    {
      value: "withTerms",
      label: "With terms",
      description:
        "Mints an escrow NFT with ownership and release rules on the next page.",
      icon: List,
    },
    {
      value: "withReceipt",
      label: "With receipt",
      description:
        "Sends funds now and mints a non-escrow receipt NFT as proof of payment.",
      icon: Receipt,
    },
    {
      value: "sendOnly",
      label: "Send only",
      description:
        "Transfers funds directly to the recipient. No NFT is minted.",
      icon: Send,
    },
  ];

export function PaymentTypeField() {
  return (
    <Field name="paymentType">
      {({ form: { values } }: FieldProps) => (
        <FormControl maxW="100%">
          <FormSection label="What Kind of Payment?">
            <PaymentTypeSelector value={values.paymentType} />
          </FormSection>
        </FormControl>
      )}
    </Field>
  );
}

function PaymentTypeSelector({ value }: { value: PaymentType }) {
  const { setFieldValue } = useFormikContext<{ paymentType: PaymentType }>();
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "paymentType",
    value,
    onChange: (val: PaymentType) => {
      setFieldValue("paymentType", val, false);
    },
  });

  const group = getRootProps();
  const selectedOption = PAYMENT_TYPE_OPTIONS.find(
    (option) => option.value === value
  );

  return (
    <Box>
      <Flex gap={{ base: 2, md: 3 }} align="stretch" {...group}>
        {PAYMENT_TYPE_OPTIONS.map(({ value: optionValue, label, icon: Icon }) => (
          <SelectableCardRow
            key={optionValue}
            radioProps={getRadioProps({ value: optionValue })}
            title={label}
            flex={1}
            px={{ base: 2.5, md: 3 }}
            gap={{ base: 2, md: 2.5 }}
            titleFontSize={{ base: "14px", md: "15px" }}
            leading={(isChecked) => (
              <Flex
                w={{ base: "28px", md: "30px" }}
                h={{ base: "28px", md: "30px" }}
                borderRadius="10px"
                align="center"
                justify="center"
                flexShrink={0}
                bg={isChecked ? "brand.200" : formTheme.iconInactiveBg}
                color={isChecked ? "brand.100" : formTheme.iconInactive}
              >
                <Icon size={17} strokeWidth={2.5} />
              </Flex>
            )}
          />
        ))}
      </Flex>
      <Box minH={{ base: "2.5rem", md: "2rem" }} mt={{ base: 3, md: 2 }}>
        {selectedOption ? (
          <Text
            fontSize="13px"
            lineHeight={1.5}
            mb={0}
            color={formTheme.mutedLight}
          >
            {selectedOption.description}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
