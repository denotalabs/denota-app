import {
  Box,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
} from "@chakra-ui/react";

function ModuleSelect() {
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
            <Select
              w={120}
              defaultValue="self"
              placeholder="Select"
              flexGrow={1}
            >
              <option value="self">Self-serve</option>
              <option value="byoa">BYOA</option>
            </Select>
          </Flex>
        </GridItem>
        <GridItem>
          <Flex alignItems={"center"}>
            <FormLabel noOfLines={1} flexShrink={0} mb={0}>
              Inspection Period
            </FormLabel>
            <Select w={120} defaultValue="90" placeholder="Select">
              <option value="90">90 days</option>
              <option value="30">30 days</option>
            </Select>
          </Flex>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default ModuleSelect;
