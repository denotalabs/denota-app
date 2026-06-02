import {
  FormControl,
  FormLabel,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

import ExternalURIField from "../../fields/input/ExternalURIField";
import ImageURIField from "../../fields/input/ImageURIField";

function MetadataBox() {
  return (
    <FormControl pt={5} maxW="100%">
      <HStack align="baseline" spacing={1} mb={2}>
        <FormLabel mb={0} mr={0}>
          Metadata
        </FormLabel>
        <Text fontSize="sm" color="whiteAlpha.600">
          (optional)
        </Text>
      </HStack>
      <VStack align="stretch" spacing={2}>
        <ExternalURIField
          fieldName="externalURI"
          placeholder="Document URL, or upload a file"
        />
        <ImageURIField
          fieldName="imageURI"
          placeholder="Image URL, or upload a file"
        />
      </VStack>
    </FormControl>
  );
}

export default MetadataBox;
