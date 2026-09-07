import { Box, Flex, Text } from "@chakra-ui/react";
import { Check, Pencil } from "lucide-react";
import { Fragment } from "react";
import { formTheme } from "../../designSystem/form/formTheme";
import { useStep } from "../../designSystem/stepper/Stepper";
import type { PaymentType } from "./PaymentTypeField";

/** Completed check; Edit captions use the form accent so they read as actions. */
const COMPLETED = "success.100";

interface StepDef {
  n: number;
  title: string;
  screenKey: string;
}

function stepsForPaymentType(paymentType: PaymentType): StepDef[] {
  if (paymentType === "withTerms") {
    return [
      { n: 1, title: "Details", screenKey: "write" },
      { n: 2, title: "Terms", screenKey: "terms" },
      { n: 3, title: "Confirm", screenKey: "confirm" },
    ];
  }
  return [
    { n: 1, title: "Details", screenKey: "write" },
    { n: 2, title: "Confirm", screenKey: "confirm" },
  ];
}

function stepAlign(
  index: number,
  last: number
): "flex-start" | "center" | "flex-end" {
  if (index === 0) return "flex-start";
  if (index === last) return "flex-end";
  return "center";
}

interface Props {
  paymentType: PaymentType;
  activeIndex: number;
}

export function PaymentFlowStepRow({ paymentType, activeIndex }: Props) {
  const { goToStep } = useStep();
  const steps = stepsForPaymentType(paymentType);
  const last = steps.length - 1;

  return (
    <Flex align="flex-start" w="100%" mb={{ base: 6, md: 5 }}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        const canGoBack = isPast && Boolean(goToStep);
        const align = stepAlign(index, last);
        const editAlign = index === 0 ? "center" : align;
        const labelColor = isPast
          ? "gray.700"
          : isActive
            ? "brand.200"
            : "gray.400";
        const numberColor = isPast
          ? COMPLETED
          : isActive
            ? "brand.200"
            : "gray.400";

        return (
          <Fragment key={step.screenKey}>
            <Box
              as="button"
              type="button"
              onClick={
                canGoBack ? () => goToStep?.(step.screenKey) : undefined
              }
              aria-label={canGoBack ? `Edit ${step.title}` : undefined}
              tabIndex={canGoBack ? 0 : -1}
              cursor={canGoBack ? "pointer" : "default"}
              bg="transparent"
              border="none"
              p={0}
              m={0}
              flexShrink={0}
              display="flex"
              flexDirection="column"
              alignItems="stretch"
              _hover={canGoBack ? { opacity: 0.75 } : undefined}
              _focusVisible={
                canGoBack
                  ? {
                    outline: "2px solid",
                    outlineColor: "brand.200",
                    outlineOffset: "2px",
                    borderRadius: "4px",
                  }
                  : undefined
              }
            >
              <Flex
                align="center"
                gap="5px"
                justify={align}
                h="15px"
                fontSize="12px"
                fontWeight={700}
                letterSpacing="0.3px"
                lineHeight="15px"
              >
                <Flex
                  w="12px"
                  h="12px"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  color={numberColor}
                >
                  {isPast ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    <Text as="span" mb={0} lineHeight={1} fontSize="12px">
                      {step.n}
                    </Text>
                  )}
                </Flex>
                <Text as="span" mb={0} color={labelColor} lineHeight="15px">
                  {step.title}
                </Text>
              </Flex>
              <Flex
                align="center"
                justify={editAlign}
                gap="3px"
                mt="1px"
                h="13px"
                color={formTheme.termsAccent}
                fontWeight={600}
                visibility={isPast ? "visible" : "hidden"}
                pointerEvents="none"
                aria-hidden={!isPast}
              >
                <Pencil size={10} strokeWidth={2.5} />
                <Text
                  fontSize="10px"
                  letterSpacing="0.2px"
                  mb={0}
                  lineHeight="13px"
                >
                  Edit
                </Text>
              </Flex>
            </Box>
            {index < last ? (
              <Box
                flex={1}
                h="1px"
                bg="brand.500"
                minW={2}
                mt="7px"
                mx={2.5}
                alignSelf="flex-start"
              />
            ) : null}
          </Fragment>
        );
      })}
    </Flex>
  );
}
