import { AddIcon, QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { Field } from "formik";
import { useState } from "react";
import RoundedBox from "../../designSystem/RoundedBox";
import Inspection from "./Inspection";

const moduleForIndex = (index: number) => {
  switch (index) {
    case 0:
      return "direct";
    case 1:
      return "escrow";
    case 2:
      return "milestone";
    default:
      return "direct";
  }
};

const indexForModule = (module: string) => {
  switch (module) {
    case "direct":
      return 0;
    case "escrow":
      return 1;
    case "milestone":
      return 2;
    default:
      return 0;
  }
};

function ModuleInfo() {
  const [sliderValue, setSliderValue] = useState(100);
  const [showTooltip, setShowTooltip] = useState(false);

  const [value, setValue] = useState("1");

  return (
    <RoundedBox padding={6}>
      <Field name="token">
        {({ field, form: { errors, touched, setFieldValue, values } }: any) => (
          <Tabs
            variant="unstyled"
            isLazy
            isFitted
            index={indexForModule(values.module)}
            onChange={(index) => {
              setFieldValue("module", moduleForIndex(index));
            }}
          >
            <TabList key={1}>
              <Tab key={1} _selected={{ color: "white", bg: "brand.200" }}>
                Direct Pay
              </Tab>
              <Tab key={2} _selected={{ color: "white", bg: "brand.200" }}>
                Escrow
              </Tab>
              <Tab key={3} _selected={{ color: "white", bg: "brand.200" }}>
                Milestones
              </Tab>
            </TabList>
            <TabPanels key={2}>
              <TabPanel key={1} pb={0}>
                <Flex flexWrap={"wrap"} direction={"column"}>
                  <Text fontSize="lg" mb={5} mt={3} fontWeight={600}>
                    {"Funds will be released immediately upon payment"}
                  </Text>
                  <FormLabel noOfLines={1} flexShrink={0} mb={3}>
                    Due date
                    <Tooltip
                      label="The minimum payment required to start work"
                      aria-label="module tooltip"
                      placement="right"
                    >
                      <QuestionOutlineIcon ml={2} mb={1} />
                    </Tooltip>
                  </FormLabel>
                  <Input
                    type="date"
                    w="200px"
                    onChange={(event) => {
                      console.log(event);
                    }}
                  />
                </Flex>
              </TabPanel>
              <TabPanel key={2} pb={0}>
                <Flex flexWrap={"wrap"} direction={"column"} gap={"18px"}>
                  {/* <FormControl> */}
                  <FormLabel noOfLines={1} flexShrink={0}>
                    Down payment amount
                    <Tooltip
                      label="The minimum payment required to start work"
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
                    onChange={(v) => setSliderValue(v)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    color="brand.200"
                    ringColor="brand.200"
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
                    <SliderTrack bg="brand.300">
                      <SliderFilledTrack bg="brand.200" />
                    </SliderTrack>
                    <Tooltip
                      hasArrow
                      bg="brand.200"
                      color="white"
                      placement="top"
                      isOpen={showTooltip}
                      label={`${sliderValue}%`}
                    >
                      <SliderThumb />
                    </Tooltip>
                  </Slider>
                  {/* </FormControl> */}
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
                      <RadioGroup
                        onChange={setValue}
                        value={value}
                        ml="2"
                        mt="2"
                      >
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
              </TabPanel>
              <TabPanel key={3} pb={0}>
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
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Field>
    </RoundedBox>
  );
}

export default ModuleInfo;
