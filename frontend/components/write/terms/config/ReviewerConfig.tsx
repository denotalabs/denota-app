import { Box, Flex, Input, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useEffect, useMemo } from "react";
import {
  convertGroupAmounts,
  groupAmountTotal,
  joinGroupAmounts,
  parseGroupAmounts,
  parseGroupSigners,
  resizeGroupAmounts,
  sumGroupAmounts,
} from "../../../../utils/paymentTerms/groupRelease";
import type {
  GroupAmountMode,
  PaymentTermsValues,
} from "../../../../utils/paymentTerms/types";
import { FormInputWrap } from "../../../designSystem/form/FormInputWrap";
import { formTheme } from "../../../designSystem/form/formTheme";
import AccountField from "../../../fields/input/AccountField";
import { ChoiceField } from "../fields/ChoiceField";
import {
  FieldError,
  FieldHelp,
  FieldLabel,
  FieldStack,
  useTermsFieldError,
} from "../fields/FieldChrome";
import { TermsDateField } from "../fields/TermsDateField";
import { TermsTextField } from "../fields/TermsTextField";

interface Props {
  amount: string | undefined;
  tokenLabel: string;
}

function AmountUnitToggle({
  value,
  onChange,
}: {
  value: GroupAmountMode;
  onChange: (value: GroupAmountMode) => void;
}) {
  return (
    <Flex
      role="radiogroup"
      aria-label="Amount unit"
      p="2px"
      bg="brand.300"
      border="1px solid"
      borderColor="brand.500"
      borderRadius="10px"
      gap="1px"
      flexShrink={0}
    >
      {(
        [
          { value: "percent", label: "%" },
          { value: "absolute", label: "$" },
        ] as const
      ).map((option) => {
        const isSelected = option.value === value;
        return (
          <Box
            key={option.value}
            as="button"
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={
              option.value === "percent" ? "Percent" : "Absolute amount"
            }
            minW="32px"
            minH="28px"
            px={2}
            border="0"
            borderRadius="8px"
            fontSize="13px"
            fontWeight={700}
            lineHeight="1"
            color={isSelected ? formTheme.textDark : formTheme.mutedLight}
            bg={isSelected ? "brand.100" : "transparent"}
            boxShadow={
              isSelected ? "0 1px 3px rgba(0, 0, 0, 0.08)" : undefined
            }
            cursor="pointer"
            _hover={{ color: formTheme.textDark }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "brand.200",
              outlineOffset: "2px",
            }}
            onClick={() => {
              if (!isSelected) {
                onChange(option.value);
              }
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Flex>
  );
}

function SignerAmountRows({
  amount,
  tokenLabel,
}: {
  amount: string | undefined;
  tokenLabel: string;
}) {
  const { values, setFieldValue } = useFormikContext<PaymentTermsValues>();
  const error = useTermsFieldError("groupSignerAmounts");
  const signers = useMemo(
    () => parseGroupSigners(values.groupSigners),
    [values.groupSigners]
  );
  const sequential = values.groupSigningOrder === "sequential";
  const suffix = values.groupAmountMode === "percent" ? "%" : tokenLabel;
  const target = groupAmountTotal(values.groupAmountMode, amount);
  const amounts = useMemo(() => {
    const stored = parseGroupAmounts(values.groupSignerAmounts);
    return resizeGroupAmounts(stored, signers.length, target);
  }, [signers.length, target, values.groupSignerAmounts]);
  const sum = sumGroupAmounts(amounts);
  const joinedAmounts = joinGroupAmounts(amounts);

  useEffect(() => {
    if (values.groupReleaseTrigger !== "proportional") {
      return;
    }
    if (joinedAmounts === values.groupSignerAmounts) {
      return;
    }
    void setFieldValue("groupSignerAmounts", joinedAmounts);
  }, [
    joinedAmounts,
    setFieldValue,
    values.groupReleaseTrigger,
    values.groupSignerAmounts,
  ]);

  const setMode = (mode: GroupAmountMode) => {
    if (mode === values.groupAmountMode) {
      return;
    }
    const escrow = Number(amount);
    const converted = convertGroupAmounts(
      amounts,
      values.groupAmountMode,
      mode,
      Number.isFinite(escrow) ? escrow : 0
    );
    void setFieldValue("groupAmountMode", mode);
    void setFieldValue("groupSignerAmounts", joinGroupAmounts(converted));
  };

  const setAmountAt = (index: number, nextValue: string) => {
    const next = [...amounts];
    next[index] = nextValue;
    void setFieldValue("groupSignerAmounts", joinGroupAmounts(next));
  };

  const readout =
    !error && sum !== null && signers.length > 0
      ? values.groupAmountMode === "percent"
        ? `Adds up to ${sum}%`
        : `Adds up to ${sum} ${tokenLabel}`
      : undefined;

  return (
    <Box>
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        mb={2}
        wrap="wrap"
      >
        <Text
          as="span"
          fontSize="14px"
          fontWeight={600}
          color={formTheme.text}
        >
          How much does each signer release?
        </Text>
        <AmountUnitToggle
          value={values.groupAmountMode}
          onChange={setMode}
        />
      </Flex>
      {signers.length === 0 ? (
        <FieldHelp>
          Add signers above. Shares default to an even split of the escrow.
        </FieldHelp>
      ) : (
        <Flex direction="column" gap={2}>
          {signers.map((signer, index) => (
            <Flex key={`${index}-${signer}`} align="center" gap={2}>
              {sequential ? (
                <Text
                  fontSize="13px"
                  fontWeight={700}
                  color={formTheme.mutedLight}
                  minW="22px"
                  flexShrink={0}
                >
                  {index + 1}.
                </Text>
              ) : null}
              <Text
                flex={1}
                minW={0}
                fontSize="13px"
                fontWeight={600}
                color={formTheme.text}
                noOfLines={1}
                title={signer}
              >
                {signer}
              </Text>
              <FormInputWrap
                borderState={error ? "invalid" : "default"}
                minH={{ base: "44px", md: "40px" }}
                w="148px"
                flexShrink={0}
                px={3}
              >
                <Input
                  value={amounts[index] ?? ""}
                  onChange={(event) => setAmountAt(index, event.target.value)}
                  variant="unstyled"
                  flex={1}
                  minW={0}
                  h="100%"
                  fontSize={{ base: "16px", md: "14px" }}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Release amount for ${signer}`}
                  aria-invalid={Boolean(error)}
                />
                <Text
                  fontSize="12px"
                  fontWeight={700}
                  color={formTheme.mutedLight}
                  flexShrink={0}
                >
                  {suffix}
                </Text>
              </FormInputWrap>
            </Flex>
          ))}
        </Flex>
      )}
      <FieldError message={error} />
      {!error && readout ? (
        <Text mt={1.5} fontSize="13px" color="brand.200" fontWeight={600}>
          {readout}
        </Text>
      ) : null}
    </Box>
  );
}

export function ReviewerConfig({ amount, tokenLabel }: Props) {
  const { values } = useFormikContext<PaymentTermsValues>();
  const singleReviewer =
    values.reviewer === "me" || values.reviewer === "other";
  const sequential =
    values.groupReleaseTrigger === "proportional" &&
    values.groupSigningOrder === "sequential";

  return (
    <FieldStack>
      <ChoiceField
        name="reviewer"
        label="Who decides?"
        options={[
          {
            value: "me",
            label: "Me",
            description:
              "You release the funds to the recipient, or take them back, from your connected wallet.",
          },
          {
            value: "other",
            label: "A reviewer",
            description:
              "A third party you trust can release the funds to the recipient or refund them to you.",
          },
          {
            value: "group",
            label: "A group",
            tag: "Coming soon",
            description: "A group of signers controls when funds move.",
          },
          {
            value: "arbitration",
            label: "Arbitration",
            tag: "Coming soon",
            description:
              "A neutral arbitration service settles disputes over the funds.",
          },
        ]}
      />

      {values.reviewer === "other" ? (
        <Box>
          <FieldLabel htmlFor="reviewerAddress">Reviewer</FieldLabel>
          <AccountField
            fieldName="reviewerAddress"
            resolvedFieldName="resolvedReviewerAddress"
            allowEns
            useFieldValidate={false}
            placeholder="Email, phone, name.eth, or 0x…"
          />
          <FieldHelp>
            This person can move the escrowed funds. Double-check the address.
          </FieldHelp>
        </Box>
      ) : null}

      {values.reviewer === "group" ? (
        <>
          <TermsTextField
            name="groupSigners"
            label="Signers"
            multiline
            placeholder={"0x…\n0x…\nname.eth"}
            help={
              sequential
                ? "One address, ENS name, email, or phone per line. They must sign in this order."
                : "One address, ENS name, email, or phone per line."
            }
          />
          <ChoiceField
            name="groupReleaseTrigger"
            label="What triggers a release?"
            layout="segments"
            options={[
              {
                value: "threshold",
                label: "Threshold",
                description:
                  "A set number of signers must agree before any funds move.",
              },
              {
                value: "proportional",
                label: "Proportional",
                description:
                  "Each signer unlocks their own share of the escrow when they sign.",
              },
            ]}
          />
          {values.groupReleaseTrigger === "threshold" ? (
            <TermsTextField
              name="groupThreshold"
              label="Approvals needed"
              inputMode="numeric"
              help="How many of the signers must agree before funds move."
            />
          ) : (
            <>
              <ChoiceField
                name="groupSigningOrder"
                label="Does signing order matter?"
                layout="segments"
                options={[
                  {
                    value: "fixed",
                    label: "Fixed",
                    description:
                      "Any signer can release their share whenever they choose.",
                  },
                  {
                    value: "sequential",
                    label: "Sequential",
                    description:
                      "Signers must release in the listed order, each unlocking their share.",
                  },
                ]}
              />
              <SignerAmountRows amount={amount} tokenLabel={tokenLabel} />
            </>
          )}
        </>
      ) : null}

      {values.reviewer === "arbitration" ? (
        <ChoiceField
          name="arbitrationProvider"
          label="Provider"
          options={[
            {
              value: "kleros",
              label: "Kleros",
              tag: "Coming soon",
              description:
                "Staked jurors review evidence and vote; the result is enforced onchain.",
            },
            {
              value: "ai",
              label: "AI arbitrator",
              tag: "Experimental",
              description:
                "A model reviews the evidence and returns a verdict through a verifiable pipeline.",
            },
            {
              value: "privateVoting",
              label: "Private voting",
              tag: "Experimental",
              description:
                "A group decides by encrypted ballot; only the aggregate result is revealed.",
            },
          ]}
        />
      ) : null}

      {singleReviewer ? (
        <ChoiceField
          name="refundWindow"
          label="How long can they refund?"
          options={[
            {
              value: "untilDecide",
              label: "Until they decide",
              description:
                "The funds stay in escrow until the reviewer releases or refunds them.",
            },
            {
              value: "untilDate",
              label: "Until a specific date",
              description:
                "After the date, the reviewer loses that power and the recipient can claim.",
            },
          ]}
        />
      ) : null}

      {singleReviewer && values.refundWindow === "untilDate" ? (
        <TermsDateField
          name="inspectionEndDate"
          label="Refund window ends"
          help="Local time. After this moment only the recipient can receive the funds."
        />
      ) : null}
    </FieldStack>
  );
}
