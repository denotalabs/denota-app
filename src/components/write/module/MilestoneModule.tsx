import { AddIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";

export function MilestoneModule() {
  return (
    <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
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
        />
      </FormControl>
      <Checkbox defaultChecked py={2}>
        Require milestone pre-funding
      </Checkbox>
    </Flex>
  );
}
