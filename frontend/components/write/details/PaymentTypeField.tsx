import {
  Box,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Text,
  useRadio,
  useRadioGroup,
  UseRadioProps,
  VStack,
} from "@chakra-ui/react";
import { Field, FieldProps, useFormikContext } from "formik";
import { IconType } from "react-icons";
import {
  MdFormatListBulleted,
  MdReceiptLong,
  MdSend,
} from "react-icons/md";

export type PaymentType = "sendOnly" | "withReceipt" | "withTerms";

const PAYMENT_TYPE_OPTIONS: {
  value: PaymentType;
  label: string;
  description: string;
  icon: IconType;
}[] = [
    {
      value: "withTerms",
      label: "With terms",
      description:
        "Mints an escrow NFT with ownership and release rules on the next page.",
      icon: MdFormatListBulleted,
    },
    {
      value: "withReceipt",
      label: "With receipt",
      description: "Transfers payment and mints an NFT receipt for the recipient.",
      icon: MdReceiptLong,
    },
    {
      value: "sendOnly",
      label: "Send only",
      description: "Transfers payment and emits logs when metadata is attached.",
      icon: MdSend,
    },
  ];

export function PaymentTypeField() {
  return (
    <Field name="paymentType">
      {({ form: { values } }: FieldProps) => (
        <FormControl pt={5} maxW="100%">
          <Divider borderColor="whiteAlpha.300" mb={4} />
          <FormLabel mb={2}>Payment type</FormLabel>
          <PaymentTypeSelector value={values.paymentType} />
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
      // Skip Formik's default validate-on-change: amount rules depend on
      // paymentType, but the amount field's validator is not re-registered
      // until after this render. PaymentFields re-validates once rules change.
      setFieldValue("paymentType", val, false);
    },
  });

  const group = getRootProps();
  const selectedDescription =
    PAYMENT_TYPE_OPTIONS.find((option) => option.value === value)?.description ??
    "";

  return (
    <VStack align="stretch" spacing={2} maxW="100%" w="100%">
      <HStack
        flexWrap={{ base: "wrap", sm: "nowrap" }}
        spacing={2}
        align="stretch"
        maxW="100%"
        w="100%"
        {...group}
      >
        {PAYMENT_TYPE_OPTIONS.map((option) => {
          const radio = getRadioProps({ value: option.value });
          return (
            <PaymentTypeChoice
              key={option.value}
              label={option.label}
              icon={option.icon}
              radioProps={radio}
            />
          );
        })}
      </HStack>
      <Text fontSize="sm" color="whiteAlpha.700" lineHeight="short">
        {selectedDescription}
      </Text>
    </VStack>
  );
}

function PaymentTypeChoice({
  label,
  icon: Icon,
  radioProps,
}: {
  label: string;
  icon: IconType;
  radioProps: UseRadioProps;
}) {
  const { getInputProps, getRadioProps } = useRadio(radioProps);

  const input = getInputProps();
  const radio = getRadioProps();

  return (
    <Box
      as="label"
      flex={{ base: "1 1 100%", sm: "1 1 0" }}
      minW={0}
      maxW="100%"
    >
      <input {...input} />
      <Box
        {...radio}
        cursor="pointer"
        borderWidth="1px"
        borderColor="whiteAlpha.300"
        borderRadius="8px"
        bg="brand.700"
        px={3}
        py={2}
        h="100%"
        w="100%"
        _checked={{
          bg: "teal.600",
          borderColor: "teal.500",
          color: "white",
        }}
        _hover={{
          borderColor: "whiteAlpha.500",
        }}
      >
        <HStack spacing={2} justify="center" w="100%">
          <Box as={Icon} boxSize={4} flexShrink={0} />
          <Text fontSize="sm" fontWeight="medium" textAlign="center">
            {label}
          </Text>
        </HStack>
      </Box>
    </Box>
  );
}
