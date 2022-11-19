import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  Select,
} from "@chakra-ui/react";
import AccountField from "../../../components/input/AccountField";
import AmountField from "../../../components/input/AmountField";
import ModeSelect from "./ModeSelect";

interface Props {
  isInvoice: boolean;
}

function DetailsBox({ isInvoice }: Props) {
  return (
    <Box borderRadius={10} padding={6} bg="gray.700" w="100%">
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"row"}>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
        >
          <FormLabel>You are</FormLabel>
          <ModeSelect isInvoice={isInvoice} />
        </Flex>
        <Flex
          w={300}
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          flexGrow={1}
        >
          <FormLabel noOfLines={1} flexShrink={0}>
            Client Address
          </FormLabel>
          <FormControl>
            <AccountField fieldName="address" placeholder="0x" />
          </FormControl>
        </Flex>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          w="200px"
        >
          <FormLabel>Amount</FormLabel>
          <AmountField />
        </Flex>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          flexGrow={1}
        >
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Input />
          </FormControl>
        </Flex>
      </Flex>
    </Box>
  );
}

export default DetailsBox;
