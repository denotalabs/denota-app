import { Flex } from "@chakra-ui/react";

import RoundedBox from "../../designSystem/RoundedBox";
import ExternalUrlField from "../../fields/input/ExternalUrlField";
import ImageUrlField from "../../fields/input/ImageURLField";
import NoteField from "../../fields/input/NoteField";

function MetadataBox() {
  return (
    <RoundedBox padding={4}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        {/* <HStack gap={16}>
          <EmailField fieldName="email" placeholder="" />
          <TagsField fieldName="tags" placeholder="" />
        </HStack> */}

        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          {/* Need to have a button for uploading a doc using lighthouse here */}
          <NoteField fieldName="note" />
        </Flex>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <ExternalUrlField fieldName="externalUrl" placeholder="" />
        </Flex>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <ImageUrlField fieldName="imageUrl" placeholder="" />
        </Flex>
      </Flex>
    </RoundedBox>
  );
}

export default MetadataBox;
