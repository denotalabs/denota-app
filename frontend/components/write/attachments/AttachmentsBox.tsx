import { Box, Collapse, Flex, HStack, Text } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { formTheme } from "../../designSystem/form/formTheme";
import InfoTooltip from "../../designSystem/InfoTooltip";
import { AttachmentField, useAttachedLinks } from "./AttachmentField";

const ATTACHMENTS_TOOLTIP =
  "Memos, invoices, contracts, delivery proofs, receipts, purchase orders, quotes, etc.";

function AttachmentsBox() {
  const [isOpen, setIsOpen] = useState(false);
  const attached = useAttachedLinks();
  const attachedCount = Object.values(attached).filter(Boolean).length;

  return (
    <Box as="section" mb={{ base: 5, md: 4 }}>
      <Flex
        as="button"
        type="button"
        w="100%"
        align="center"
        justify="space-between"
        textAlign="left"
        aria-expanded={isOpen}
        aria-controls="attachments-panel"
        onClick={() => setIsOpen((open) => !open)}
        py={1}
      >
        <HStack align="baseline" spacing={1}>
          <Text
            fontSize={{ base: "17px", md: "md" }}
            fontWeight={700}
            color={formTheme.text}
          >
            Attachments
          </Text>
          <Text fontSize="sm" color={formTheme.muted}>
            (optional)
          </Text>
          {/* Keep tooltip taps from toggling the panel on mobile. */}
          <Box as="span" onClick={(event) => event.stopPropagation()}>
            <InfoTooltip label={ATTACHMENTS_TOOLTIP} />
          </Box>
        </HStack>
        <HStack spacing={2}>
          {attachedCount > 0 ? (
            <Text
              as="span"
              fontSize="11.5px"
              fontWeight={700}
              lineHeight={1}
              px={2}
              py={1}
              borderRadius="full"
              bg="green.900"
              border="1px solid"
              borderColor="green.700"
              color="green.200"
              whiteSpace="nowrap"
            >
              {attachedCount} attached
            </Text>
          ) : null}
          <Box
            color={formTheme.muted}
            display="flex"
            transition="transform 0.2s ease"
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          >
            <ChevronDown size={18} strokeWidth={2.25} />
          </Box>
        </HStack>
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Box id="attachments-panel" pt={{ base: 3, md: 2.5 }}>
          <AttachmentField />
        </Box>
      </Collapse>
    </Box>
  );
}

export default AttachmentsBox;
