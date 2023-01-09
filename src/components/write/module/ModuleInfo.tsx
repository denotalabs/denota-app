import { Box, Flex, FormLabel, Grid, GridItem } from "@chakra-ui/react";
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
            <FormLabel mb={0}>Module</FormLabel>
            <ModuleSelect />
          </Flex>
        </GridItem>
        <GridItem>
          <Flex alignItems={"center"}>
            <FormLabel noOfLines={1} flexShrink={0} mb={0}>
              Release Date
            </FormLabel>
            <Inspection />
          </Flex>
        </GridItem>
      </Grid>
    </RoundedBox>
  );
}

export default ModuleInfo;
