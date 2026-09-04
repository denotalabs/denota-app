import { Box, Flex, Text } from "@chakra-ui/react";
import type { PaymentType } from "./PaymentTypeField";

interface StepDef {
  label: string;
}

function stepsForPaymentType(paymentType: PaymentType): StepDef[] {
  if (paymentType === "withTerms") {
    return [
      { label: "1 Details" },
      { label: "2 Terms" },
      { label: "3 Confirm" },
    ];
  }
  return [{ label: "1 Details" }, { label: "2 Confirm" }];
}

interface Props {
  paymentType: PaymentType;
  activeIndex: number;
}

export function PaymentFlowStepRow({ paymentType, activeIndex }: Props) {
  const steps = stepsForPaymentType(paymentType);

  return (
    <Flex
      align="center"
      gap={2.5}
      w="100%"
      mb={{ base: "18px", md: 3 }}
      fontSize="12px"
      fontWeight={700}
    >
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        return (
          <Flex
            key={step.label}
            align="center"
            gap={2.5}
            flex={index < steps.length - 1 ? 1 : undefined}
            minW={0}
          >
            <Text
              color={isActive || isPast ? "brand.200" : "gray.400"}
              letterSpacing="0.3px"
              flexShrink={0}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 ? (
              <Box flex={1} h="1px" bg="brand.500" minW={2} />
            ) : null}
          </Flex>
        );
      })}
    </Flex>
  );
}
