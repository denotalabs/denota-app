import { Flex, FormControl, FormLabel, Input } from "@chakra-ui/react";
import AccountField from "../../legacy/input/AccountField";
import AmountField from "../../legacy/input/AmountField";
import RoundedBox from "../../designSystem/RoundedBox";
import ModeSelect from "./ModeSelect";

interface Props {
  isInvoice: boolean;
}

function DetailsBox({ isInvoice }: Props) {
  return (
    <RoundedBox padding={6}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"row"}>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          w="200px"
        >
          <FormLabel mb={0}>You are</FormLabel>
          <ModeSelect isInvoice={isInvoice} />
        </Flex>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          flexGrow={1}
          w="300px"
          maxW="100%"
        >
          <FormLabel noOfLines={1} flexShrink={0} mb={0}>
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
          <FormLabel mb={0}>Amount</FormLabel>
          <AmountField />
        </Flex>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <FormLabel mb={0}>Notes</FormLabel>
          <FormControl>
            <Input />
          </FormControl>
        </Flex>
      </Flex>
    </RoundedBox>
  );
}

export default DetailsBox;
