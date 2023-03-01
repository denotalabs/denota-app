import { Flex, FormControl, FormLabel } from "@chakra-ui/react";

import RoundedBox from "../../designSystem/RoundedBox";
import AccountField from "../../fields/input/AccountField";
import AmountField from "../../fields/input/AmountField";
import EmailField from "../../fields/input/EmailField";
import NoteField from "../../fields/input/NoteField";
import FileControl from "./FileUpload";

interface Props {
  isInvoice: boolean;
}

function DetailsBox({ isInvoice }: Props) {
  return (
    <RoundedBox padding={4}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        {/* <FormControl
          alignItems={"center"}
          justifyContent={"space-between"}
          flexShrink={0}
          w="200px"
        >
          <FormLabel>Type</FormLabel>
          <ModeSelect isInvoice={isInvoice} />
        </FormControl> */}
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
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
        <EmailField fieldName="email" placeholder="" />
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <NoteField fieldName="note" />
        </Flex>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <FileControl name="file" />
        </Flex>
      </Flex>
    </RoundedBox>
  );
}

export default DetailsBox;
