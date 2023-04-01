import { AddIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useCurrencyDisplayName } from "../../../hooks/useCurrencyDisplayName";
import { CheqCurrency } from "../../designSystem/CurrencyIcon";

export function MilestoneTerms() {
  const [milestones, setMilestones] = useState<string[]>([""]);
  const { formData } = useNotaForm();

  const { displayNameForCurrency } = useCurrencyDisplayName();

  // TODO: integrate with Formik
  const appendMilestone = useCallback(() => {
    setMilestones((milestones) => [...milestones, ""]);
  }, []);

  return (
    <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
      {milestones.map((item, index) => {
        return (
          <FormControl>
            <FormLabel noOfLines={1} flexShrink={0}>
              Milestone #{index + 1}
            </FormLabel>
            <Input value={item} />
          </FormControl>
        );
      })}
      <Text textAlign="right">
        Total amount must add up to {formData.amount}{" "}
        {displayNameForCurrency(formData.token as CheqCurrency)}
      </Text>
      <FormControl>
        <FormLabel noOfLines={1} flexShrink={0} mb={3}>
          Add Milestones
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
