import { Flex, FormControl, FormLabel } from "@chakra-ui/react";

import RoundedBox from "../../designSystem/RoundedBox";
import AccountField from "../../fields/input/AccountField";
import AmountField from "../../fields/input/AmountField";
import EmailField from "../../fields/input/EmailField";
import NoteField from "../../fields/input/NoteField";
import TagsField from "../../fields/input/TagsField";
import FileControl from "./FileUpload";

interface Props {
  isInvoice: boolean;
  token: string;
  mode: string;
}

function DetailsBox({ isInvoice, token, mode }: Props) {
  return (
    <RoundedBox padding={4}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        <Flex
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <FormControl w="200px" mr={5}>
            <FormLabel>Amount</FormLabel>
            <AmountField token={token} mode={mode} />
          </FormControl>
          <AccountField fieldName="address" placeholder="0x" />
        </Flex>
        <EmailField fieldName="email" placeholder="" />
        <TagsField fieldName="tags" placeholder="" />
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
