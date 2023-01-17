import {
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import AccountField from "../../legacy/input/AccountField";
import AmountField from "../../legacy/input/AmountField";
import RoundedBox from "../../designSystem/RoundedBox";
import { Textarea } from "@chakra-ui/react";

interface Props {
  isInvoice: boolean;
}

function DetailsBox({ isInvoice }: Props) {
  return (
    <RoundedBox padding={4}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
        >
          <FormControl w="200px" mr={5}>
            <FormLabel>Amount</FormLabel>
            <AmountField />
          </FormControl>
          <FormControl>
            <FormLabel noOfLines={1} flexShrink={0}>
              Client Address
            </FormLabel>
            <AccountField fieldName="address" placeholder="0x" />
          </FormControl>
        </Flex>

        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea />
            <FormHelperText>
              Notes are uploaded to IPFS. Please don't inlcude sensitive data
            </FormHelperText>
          </FormControl>
        </Flex>
      </Flex>
    </RoundedBox>
  );
}

export default DetailsBox;
