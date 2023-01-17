import { QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Tooltip,
} from "@chakra-ui/react";
import RoundedBox from "../../designSystem/RoundedBox";
import Inspection from "./Inspection";
import ModuleSelect from "./ModuleSelect";

function ModuleInfo() {
  return (
    <RoundedBox padding={6}>
      <Grid
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
      </Grid>
    </RoundedBox>
  );
}

export default ModuleInfo;
