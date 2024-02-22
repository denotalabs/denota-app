import { Box, Flex, HStack } from "@chakra-ui/react";

import RoundedBox from "../../designSystem/RoundedBox";
import EmailField from "../../fields/input/EmailField";
import ExternalUrlField from "../../fields/input/ExternalUrlField";
import ImageUrlField from "../../fields/input/ImageURLField";
import NoteField from "../../fields/input/NoteField";
import TagsField from "../../fields/input/TagsField";
import FileControl from "./FileUpload";

function MetadataBox() {
  return (
    <RoundedBox padding={4}>
      <Flex flexWrap={"wrap"} gap={"18px"} direction={"column"}>
        <HStack gap={16}>
          <EmailField fieldName="email" placeholder="" />
          <TagsField fieldName="tags" placeholder="" />
        </HStack>

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
          <ExternalUrlField fieldName="externalUrl" placeholder="" />
        </Flex>
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
          flexGrow={1}
          maxW="100%"
        >
          <HStack width="full">
            <Box flexGrow={1} flexShrink={0}>
              <ImageUrlField fieldName="imageUrl" placeholder="" />
            </Box>
            <Box flexShrink={1}>
              <FileControl name="imageUrl" />
            </Box>
          </HStack>
        </Flex>
      </Flex>
    </RoundedBox>
  );
}

export default MetadataBox;
