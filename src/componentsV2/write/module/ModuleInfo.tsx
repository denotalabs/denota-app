import { Box, Flex, FormLabel, Grid, GridItem } from "@chakra-ui/react";
import Inspection from "./Inspection";
import ModuleSelect from "./ModuleSelect";

function ModuleInfo() {
  return (
    <Box borderRadius={10} padding={6} bg="gray.700" w="100%">
      <Grid
        templateColumns="1fr 1fr"
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
              Inspection Period
            </FormLabel>
            <Inspection />
          </Flex>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default ModuleInfo;
