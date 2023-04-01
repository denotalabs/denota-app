import { AddIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  NumberInput,
  NumberInputField,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useCallback, useEffect } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useCurrencyDisplayName } from "../../../hooks/useCurrencyDisplayName";
import { CheqCurrency } from "../../designSystem/CurrencyIcon";
import { PaymentTermsFormValues } from "./PaymentTermsStep";

export function MilestoneTerms() {
  const { values, setFieldValue, setFieldError, errors } =
    useFormikContext<PaymentTermsFormValues>();

  const { formData } = useNotaForm();

  const { displayNameForCurrency } = useCurrencyDisplayName();

  const appendMilestone = useCallback(() => {
    setFieldValue("milestones", [...values.milestones, ""], false);
  }, [setFieldValue, values.milestones]);

  const setMilestone = useCallback(
    (index: number, value: string) => {
      const newMilestones = values.milestones;
      newMilestones[index] = value;
      setFieldValue("milestones", [...newMilestones], false);
    },
    [setFieldValue, values.milestones]
  );

  useEffect(() => {
    const total = values.milestones.reduce(
      (total, current) => total + Number(current),
      0
    );

    if (total !== Number(formData.amount)) {
      setFieldError("milestones", "Milestones should add up to total value");
    } else {
      setFieldError("milestones", undefined);
    }
  }, [formData.amount, setFieldError, values.milestones]);

  return (
    <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
      {values.milestones.map((item, index) => {
        return (
          <FormControl key={index}>
            <FormLabel noOfLines={1} flexShrink={0}>
              Milestone #{index + 1}
            </FormLabel>
            <NumberInput
              value={item}
              onChange={(val) => {
                setMilestone(index, val);
              }}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
        );
      })}
      <Text textAlign="right" textColor={errors.milestones ? "red" : undefined}>
        Total amount must add up to {formData.amount}{" "}
        {displayNameForCurrency(formData.token as CheqCurrency)}
      </Text>
      <FormControl>
        <FormLabel noOfLines={1} flexShrink={0} mb={3}>
          Add Milestone
          <Tooltip
            label="Break the payment into milestones"
            aria-label="module tooltip"
            placement="right"
          >
            <QuestionOutlineIcon ml={2} mb={1} />
          </Tooltip>
        </FormLabel>
        <IconButton
          variant="outline"
          aria-label="Call Sage"
          size="sm"
          fontSize="15px"
          color="brand.200"
          icon={<AddIcon />}
          onClick={appendMilestone}
        />
      </FormControl>
      <Checkbox defaultChecked py={2}>
        Require milestone pre-funding
      </Checkbox>
    </Flex>
  );
}
