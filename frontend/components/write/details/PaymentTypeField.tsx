import { Box, Flex, FormControl, Text, useRadioGroup } from "@chakra-ui/react";
import { Field, FieldProps, useFormikContext } from "formik";
import { List, Receipt, Send } from "lucide-react";
import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";
import { SegmentedControl } from "../../designSystem/form/SegmentedControl";
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
  const onChange = (val: PaymentType) => {
    setFieldValue("paymentType", val, false);
  };
  const selectedOption = PAYMENT_TYPE_OPTIONS.find(
    (option) => option.value === value
  );

  return (
    <Box>
      <Box display={{ base: "block", md: "none" }}>
        <SegmentedControl
          name="paymentType"
          value={value}
          options={PAYMENT_TYPE_OPTIONS}
          onChange={onChange}
          aria-label="Payment type"
        />
      </Box>
      <Box display={{ base: "none", md: "block" }}>
        <PaymentTypeCards value={value} onChange={onChange} />
      </Box>
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

function PaymentTypeCards({
  value,
  onChange,
}: {
  value: PaymentType;
  onChange: (val: PaymentType) => void;
}) {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "paymentType",
    value,
    onChange,
  });

  return (
    <Flex gap={3} align="stretch" {...getRootProps()}>
      {PAYMENT_TYPE_OPTIONS.map(({ value: optionValue, label, icon: Icon }) => (
        <SelectableCardRow
          key={optionValue}
          radioProps={getRadioProps({ value: optionValue })}
          title={label}
          flex={1}
          px={3}
          gap={2.5}
          titleFontSize="15px"
          leading={(isChecked) => (
            <Flex
              w="30px"
              h="30px"
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
  );
}
