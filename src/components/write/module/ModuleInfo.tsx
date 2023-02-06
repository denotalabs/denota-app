import { AddIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useState } from "react";
import RoundedBox from "../../designSystem/RoundedBox";
import Inspection from "./Inspection";

function ModuleInfo() {
  const [sliderValue, setSliderValue] = useState(100);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <RoundedBox padding={6}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        <FormControl>
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
            Down payment amount
            <Tooltip
              label="The amount of time the payer has to request a refund"
              aria-label="module tooltip"
              placement="right"
            >
              <QuestionOutlineIcon ml={2} mb={1} />
            </Tooltip>
          </FormLabel>
          <Slider
            id="slider"
            defaultValue={100}
            min={0}
            max={100}
            colorScheme="teal"
            onChange={(v) => setSliderValue(v)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            w="80%"
          >
            <SliderMark value={0} mt="1" fontSize="sm">
              0%
            </SliderMark>
            <SliderMark value={50} mt="1" ml="-2.5" fontSize="sm">
              50%
            </SliderMark>
            <SliderMark value={100} mt="1" ml="-2.5" fontSize="sm">
              100%
            </SliderMark>
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <Tooltip
              hasArrow
              bg="teal.500"
              color="white"
              placement="top"
              isOpen={showTooltip}
              label={`${sliderValue}%`}
            >
              <SliderThumb />
            </Tooltip>
          </Slider>
        </FormControl>
        <FormControl mt="5">
          <FormLabel noOfLines={1} flexShrink={0}>
            Disputation method
            <Tooltip
              label="The amount of time the payer has to request a refund"
              aria-label="module tooltip"
              placement="right"
            >
              <QuestionOutlineIcon ml={2} mb={1} />
            </Tooltip>
            <RadioGroup defaultValue="1" ml="2" mt="2">
              <Stack direction="column">
                <Radio value="1">Self-serve</Radio>
                <Radio value="2">Third-party auditor</Radio>
                <Radio value="3">Kleros</Radio>
              </Stack>
            </RadioGroup>
          </FormLabel>
        </FormControl>
        <FormControl>
          <FormLabel noOfLines={1} flexShrink={0}>
            Milestones
            <Tooltip
              label="The amount of time the payer has to request a refund"
              aria-label="module tooltip"
              placement="right"
            >
              <QuestionOutlineIcon ml={2} mb={1} />
            </Tooltip>
          </FormLabel>
          <IconButton
            variant="outline"
            colorScheme="teal"
            aria-label="Call Sage"
            size="sm"
            fontSize="15px"
            icon={<AddIcon />}
          />
        </FormControl>
      </Flex>

      {/* <Grid
        templateColumns="repeat(auto-fit, minmax(240px, 1fr))"
        templateRows="repeat(1, 1fr)"
        gap={6}
        h="100%"
      >
        <GridItem>
          <Flex alignItems={"center"}>
            <FormControl>
              <FormLabel>
                Module
                <Tooltip
                  label="The module specifies the payment conditions"
                  aria-label="module tooltip"
                  placement="right"
                >
                  <QuestionOutlineIcon ml={2} mb={1} />
                </Tooltip>
              </FormLabel>

              <ModuleSelect />
            </FormControl>
          </Flex>
        </GridItem>
        <GridItem>
          <Flex alignItems={"center"}>
            <FormControl>
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
          </Flex>
        </GridItem>
      </Grid> */}
    </RoundedBox>
  );
}

export default ModuleInfo;
