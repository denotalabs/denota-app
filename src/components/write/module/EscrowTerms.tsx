import { QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Flex,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useState } from "react";
import Inspection from "./Inspection";

export function EscrowTerms() {
  const [sliderValue, setSliderValue] = useState(100);
  const [showTooltip, setShowTooltip] = useState(false);

  const [value, setValue] = useState("1");
  return (
    <Flex flexWrap={"wrap"} direction={"column"} gap={"18px"}>
      <FormControl mt={5}>
        <FormLabel noOfLines={1} flexShrink={0}>
          Inspection Period
          <Tooltip
            label="The amount of time the payer has to request a refund"
            aria-label="module tooltip"
            placement="right"
          >
            <QuestionOutlineIcon ml={2} mb={1} />
          </Tooltip>
        </FormLabel>
        <Inspection />
      </FormControl>
      <FormControl>
        <FormLabel noOfLines={1} flexShrink={0}>
          Disputation method
          <Tooltip
            label="Method for resolving payment disputes"
            aria-label="module tooltip"
            placement="right"
          >
            <QuestionOutlineIcon ml={2} mb={1} />
          </Tooltip>
          <RadioGroup onChange={setValue} value={value} ml="2" mt="2">
            <Stack direction="column">
              {/*TODO: figure out correct way to set radio colors*/}
              <Radio
                colorScheme="brand.200"
                bgColor={value == "1" ? "brand.200" : "clear"}
                value="1"
              >
                Self-serve
              </Radio>
              <Radio
                colorScheme="brand.200"
                bgColor={value == "2" ? "brand.200" : "clear"}
                value="2"
              >
                Third-party auditor
              </Radio>
              <Radio
                colorScheme="brand.200"
                bgColor={value == "3" ? "brand.200" : "clear"}
                value="3"
              >
                Kleros
              </Radio>
            </Stack>
          </RadioGroup>
        </FormLabel>
      </FormControl>
    </Flex>
  );
}
