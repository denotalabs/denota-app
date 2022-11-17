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

interface Props {
  isInvoice: boolean;
}

function DetailsBox({ isInvoice }: Props) {
  return (
    <Box borderRadius={10} padding={6} bg="gray.700" w="100%" h="140px">
      <Grid
        templateColumns="2fr 3fr"
        templateRows="repeat(2, 1fr)"
        gap={6}
        h="100%"
      >
        <GridItem>
          <Flex alignItems={"center"} justifyContent={"space-between"}>
            <FormLabel>You are</FormLabel>
            <Select
              defaultValue={isInvoice ? "invoice" : "pay"}
              w={120}
              placeholder="Select"
            >
              <option value="invoice">Invoicing</option>
              <option value="pay">Paying</option>
            </Select>
          </Flex>
        </GridItem>
        <GridItem>
          <Flex alignItems={"center"} justifyContent={"space-between"}>
            <FormLabel noOfLines={1} flexShrink={0}>
              Client Address
            </FormLabel>
            <FormControl>
              <Input placeholder="0x..." />
            </FormControl>
          </Flex>
        </GridItem>
        <GridItem>
          <Flex alignItems={"center"} justifyContent={"space-between"}>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <NumberInput
                precision={2}
                step={0.1}
                min={0}
                // TODO add max, set by user's balance
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </Flex>
        </GridItem>
        <GridItem>
          <Flex alignItems={"center"} justifyContent={"space-between"}>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Input />
            </FormControl>
          </Flex>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default DetailsBox;
