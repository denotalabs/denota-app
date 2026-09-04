import { Box, Flex, Text } from "@chakra-ui/react";
import { SlidersHorizontal } from "lucide-react";
import {
  type AttachmentStorageSettings,
  storageSettingsChips,
  storageSettingsSummary,
} from "../../../utils/attachmentStorage";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props {
  settings: AttachmentStorageSettings;
  onOpenSettings: () => void;
}

/**
 * Bottom row of the attachment box: a text-styled button that opens the
 * attachment storage modal, and a read-only chip projection of the applied
 * settings (e.g. Durable · Public · Standard).
 */
export function AttachmentStorageFooter({ settings, onOpenSettings }: Props) {
  const chips = storageSettingsChips(settings);

  return (
    <Flex
      align="center"
      justify="space-between"
      gap={2}
      px={3}
      py={2}
      borderTop="1px solid"
      borderColor={formTheme.borderDefault}
    >
      <Box
        as="button"
        type="button"
        onClick={onOpenSettings}
        aria-haspopup="dialog"
        display="inline-flex"
        alignItems="center"
        gap={1.5}
        minW={0}
        p={0}
        bg="transparent"
        border="none"
        fontSize="13px"
        fontWeight={600}
        lineHeight={1}
        color={formTheme.primary}
        cursor="pointer"
        transition="color 0.15s ease"
        _hover={{ color: formTheme.textDark }}
        _focusVisible={{
          outline: "2px solid",
          outlineColor: "notaPurple.100",
          outlineOffset: "3px",
          borderRadius: "4px",
        }}
      >
        <Box as="span" display="flex" flexShrink={0}>
          <SlidersHorizontal size={14} strokeWidth={2.25} />
        </Box>
        <Text as="span" noOfLines={1}>
          Upload settings
        </Text>
      </Box>
      <Flex
        as="ul"
        role="list"
        aria-label={`Current settings: ${storageSettingsSummary(settings)}`}
        listStyleType="none"
        m={0}
        p={0}
        gap={1}
        flexShrink={0}
      >
        {chips.map((chip) => (
          <Box
            key={chip}
            as="li"
            fontSize="11px"
            fontWeight={700}
            lineHeight={1}
            px={1.5}
            py={1}
            borderRadius="full"
            bg="gray.100"
            color={formTheme.mutedLight}
            whiteSpace="nowrap"
          >
            {chip}
          </Box>
        ))}
      </Flex>
    </Flex>
  );
}

export default AttachmentStorageFooter;
