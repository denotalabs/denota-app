import { HStack, Text, VStack } from "@chakra-ui/react";

import { FormSection } from "../../designSystem/form/FormSection";
import { formTheme } from "../../designSystem/form/formTheme";
import InfoTooltip from "../../designSystem/InfoTooltip";
import ExternalURIField from "../../fields/input/ExternalURIField";
import ImageURIField from "../../fields/input/ImageURIField";

const METADATA_TOOLTIP =
  "Memos, invoices, contracts, delivery proofs, receipts, purchase orders, quotes, etc.";

function MetadataBox() {
  return (
    <FormSection
      label={
        <HStack align="baseline" spacing={1}>
          <Text
            fontSize={{ base: "17px", md: "md" }}
            fontWeight={700}
            color={formTheme.text}
          >
            Metadata
          </Text>
          <Text fontSize="sm" color={formTheme.muted}>
            (optional)
          </Text>
          <InfoTooltip label={METADATA_TOOLTIP} />
        </HStack>
      }
    >
      {/* <Text fontSize="sm" color={formTheme.mutedLight} mb={3}>
        Attach a document or image to record what this payment is for.
      </Text> */}
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
    </FormSection>
  );
}

export default MetadataBox;
