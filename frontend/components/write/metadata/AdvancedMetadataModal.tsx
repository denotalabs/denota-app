import {
  Box,
  Button,
  Checkbox,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  useRadio,
  useRadioGroup,
  type UseRadioProps,
} from "@chakra-ui/react";
import {
  Clock,
  Cloud,
  Database,
  Eye,
  FileBadge,
  Globe,
  Infinity as InfinityIcon,
  Layers,
  Link,
  type LucideIcon,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import {
  type AttachmentStorageSettings,
  getStorageOption,
  STORAGE_OPTIONS,
  type StorageId,
  type StorageOption,
} from "../../../utils/attachmentStorage";
import { formTheme } from "../../designSystem/form/formTheme";

const STORAGE_ICONS: Record<StorageId, LucideIcon> = {
  ipfs: Globe,
  arweave: InfinityIcon,
  hosted: Cloud,
  ethstorage: Database,
  ethfs: Layers,
};

const SUBTITLE =
  "Where the attachment lives, who can read it, how it's proven.";
const ENCRYPT_DESCRIPTION =
  "Client-side encryption tied to nota NFT ownership.";
const NOTARIZE_DESCRIPTION = "Anchor a blob hash for stronger proof.";

const AVAILABLE_TITLES = STORAGE_OPTIONS.filter((option) => option.available)
  .map((option) => option.title)
  .join(" or ");

/** Why Apply is blocked for the selected tier, or null when it can be applied. */
function applyBlockedReason(option: StorageOption): string | null {
  if (option.available) {
    return null;
  }
  return `${option.title} isn't available yet. Choose ${AVAILABLE_TITLES} to apply.`;
}

const panelProps = {
  bg: "brand.600",
  border: "1px solid",
  borderColor: "brand.500",
  borderRadius: "12px",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Currently applied settings; the modal edits a draft copy. */
  value: AttachmentStorageSettings;
  onApply: (settings: AttachmentStorageSettings) => void;
}

/**
 * Configures how an attachment is stored, who can read it, and how it's
 * proven. Cancel discards the draft; Apply commits it back to the parent.
 */
export function AdvancedMetadataModal({
  isOpen,
  onClose,
  value,
  onApply,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg="brand.400"
        border="1px solid"
        borderColor="brand.500"
        borderRadius="16px"
        mx={4}
        maxW="440px"
        color={formTheme.text}
      >
        {/* Mounted only while open, so each open starts from the applied value. */}
        <AdvancedMetadataForm
          initial={value}
          onCancel={onClose}
          onApply={(settings) => {
            onApply(settings);
            onClose();
          }}
        />
      </ModalContent>
    </Modal>
  );
}

function AdvancedMetadataForm({
  initial,
  onCancel,
  onApply,
}: {
  initial: AttachmentStorageSettings;
  onCancel: () => void;
  onApply: (settings: AttachmentStorageSettings) => void;
}) {
  const [draft, setDraft] = useState<AttachmentStorageSettings>(initial);
  const selectedOption = getStorageOption(draft.storage);
  const blockedReason = applyBlockedReason(selectedOption);
  const blockedReasonId = useId();

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "attachmentStorage",
    value: draft.storage,
    onChange: (storage: StorageId) =>
      setDraft((current) => ({ ...current, storage })),
  });

  return (
    <>
      <ModalHeader pb={1} pr={12}>
        <Flex align="flex-start" gap={2.5}>
          <Box color={formTheme.primary} display="flex" flexShrink={0} mt="2px">
            <SlidersHorizontal size={18} strokeWidth={2.25} />
          </Box>
          <Box minW={0}>
            <Text fontSize="17px" fontWeight={700} color={formTheme.textDark}>
              Attachments
            </Text>
            <Text
              fontSize="13px"
              fontWeight={400}
              color={formTheme.muted}
              lineHeight={1.45}
              mt={0.5}
            >
              {SUBTITLE}
            </Text>
          </Box>
        </Flex>
      </ModalHeader>
      <ModalCloseButton color={formTheme.muted} />
      <ModalBody px={5} pt={3} pb={2}>
        <SectionLabel icon={MapPin}>Storage</SectionLabel>
        <SimpleGrid columns={3} spacing={2} {...getRootProps()}>
          {STORAGE_OPTIONS.map((option) => (
            <StorageTile
              key={option.id}
              option={option}
              radioProps={getRadioProps({ value: option.id })}
            />
          ))}
        </SimpleGrid>
        <Text
          mt={2}
          fontSize="13px"
          lineHeight={1.5}
          color={formTheme.mutedLight}
          minH="1.5em"
          aria-live="polite"
        >
          {selectedOption.helper}
        </Text>

        <SectionLabel icon={Eye} mt={4}>
          Who can read it
        </SectionLabel>
        <Box {...panelProps}>
          <HandlingOption
            label="Encrypt contents"
            description={ENCRYPT_DESCRIPTION}
            isChecked={draft.encrypted}
            onChange={(encrypted) =>
              setDraft((current) => ({ ...current, encrypted }))
            }
          />
        </Box>

        <SectionLabel icon={FileBadge} mt={4}>
          Proof
        </SectionLabel>
        <Box {...panelProps}>
          <HandlingOption
            label="Notarize"
            description={NOTARIZE_DESCRIPTION}
            isChecked={draft.notarized}
            onChange={(notarized) =>
              setDraft((current) => ({ ...current, notarized }))
            }
          />
        </Box>
      </ModalBody>
      <ModalFooter px={5} pt={3} pb={5} gap={3} alignItems="center">
        {blockedReason ? (
          <Flex
            id={blockedReasonId}
            role="status"
            align="center"
            gap={1.5}
            flex={1}
            minW={0}
            color="orange.200"
            fontSize="12.5px"
            fontWeight={500}
            lineHeight={1.4}
          >
            <Box display="flex" flexShrink={0}>
              <Clock size={14} strokeWidth={2.25} />
            </Box>
            <Text as="span">{blockedReason}</Text>
          </Flex>
        ) : (
          <Box flex={1} />
        )}
        <Button
          type="button"
          variant="ghost"
          h="42px"
          px={4}
          borderRadius="12px"
          fontSize="15px"
          fontWeight={600}
          color={formTheme.mutedLight}
          _hover={{ bg: "brand.300", color: formTheme.text }}
          _active={{ bg: "brand.300" }}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          h="42px"
          px={5}
          borderRadius="12px"
          fontSize="15px"
          fontWeight={700}
          bg="brand.200"
          color="brand.100"
          _hover={{ bg: "brand.200", opacity: 0.9, _disabled: { opacity: 0.4 } }}
          _active={{ bg: "brand.200" }}
          _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
          isDisabled={!!blockedReason}
          aria-describedby={blockedReason ? blockedReasonId : undefined}
          onClick={() => onApply(draft)}
        >
          Apply
        </Button>
      </ModalFooter>
    </>
  );
}

function SectionLabel({
  icon: Icon,
  children,
  mt,
}: {
  icon: LucideIcon;
  children: ReactNode;
  mt?: number;
}) {
  return (
    <Flex align="center" gap={1.5} mt={mt} mb={2} color={formTheme.mutedFaded}>
      <Box display="flex" flexShrink={0}>
        <Icon size={13} strokeWidth={2.5} />
      </Box>
      <Text
        fontSize="12px"
        fontWeight={700}
        letterSpacing="0.04em"
        textTransform="uppercase"
      >
        {children}
      </Text>
    </Flex>
  );
}

function StorageTile({
  option,
  radioProps,
}: {
  option: StorageOption;
  radioProps: UseRadioProps;
}) {
  const { state, getInputProps, getRadioProps } = useRadio(radioProps);
  const { isChecked } = state;
  const Icon = STORAGE_ICONS[option.id];

  return (
    <Box as="label" minW={0} cursor="pointer">
      <input {...getInputProps()} />
      <Flex
        {...getRadioProps()}
        position="relative"
        direction="column"
        align="center"
        justify="center"
        gap={1.5}
        px={2}
        py={3}
        borderRadius="14px"
        border="1px solid"
        borderColor="brand.500"
        bg="brand.600"
        // Icon and title take the same color as the border when checked.
        color={isChecked ? "brand.200" : formTheme.iconInactive}
        transition="border-color 0.15s ease, background 0.15s ease, color 0.15s ease"
        _hover={{ borderColor: "notaPurple.100" }}
        _checked={{
          borderColor: "brand.200",
          bg: "brand.300",
          boxShadow: "0 0 0 1px var(--chakra-colors-brand-200) inset",
          _hover: { borderColor: "brand.200" },
        }}
        _focusVisible={{
          outline: "2px solid",
          outlineColor: "notaPurple.100",
          outlineOffset: "2px",
        }}
      >
        {!option.available ? (
          <Text
            as="span"
            position="absolute"
            top="6px"
            left="6px"
            fontSize="9px"
            fontWeight={700}
            lineHeight={1}
            letterSpacing="0.06em"
            textTransform="uppercase"
            px={1}
            py="3px"
            borderRadius="4px"
            bg="brand.500"
            color={formTheme.mutedLight}
          >
            Soon
          </Text>
        ) : null}
        {option.onchain ? (
          <Flex
            position="absolute"
            top="6px"
            right="6px"
            w="16px"
            h="16px"
            borderRadius="full"
            align="center"
            justify="center"
            bg={isChecked ? "brand.200" : "brand.500"}
            color={isChecked ? "brand.100" : formTheme.mutedLight}
            title="Stored on-chain"
            aria-hidden
          >
            <Link size={9} strokeWidth={2.75} />
          </Flex>
        ) : null}
        <Box display="flex" h="32px" alignItems="center">
          <Icon size={22} strokeWidth={isChecked ? 2.5 : 2} />
        </Box>
        <Text
          fontSize="13px"
          fontWeight={isChecked ? 700 : 600}
          color={isChecked ? formTheme.textDark : formTheme.mutedLight}
          noOfLines={1}
        >
          {option.title}
        </Text>
      </Flex>
    </Box>
  );
}

function HandlingOption({
  label,
  description,
  isChecked,
  onChange,
}: {
  label: string;
  description: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Checkbox
      isChecked={isChecked}
      onChange={(event) => onChange(event.target.checked)}
      w="100%"
      alignItems="flex-start"
      spacing={3}
      px={3}
      py={2.5}
      cursor="pointer"
      sx={{
        ".chakra-checkbox__control": {
          mt: "2px",
          borderColor: "whiteAlpha.400",
          borderRadius: "5px",
        },
      }}
    >
      {/* Spans: the checkbox label slot is inline content. */}
      <Text
        as="span"
        display="block"
        fontSize="14px"
        fontWeight={600}
        lineHeight={1.3}
        color={formTheme.text}
      >
        {label}
      </Text>
      <Text
        as="span"
        display="block"
        fontSize="12.5px"
        lineHeight={1.45}
        mt={0.5}
        color={formTheme.muted}
      >
        {description}
      </Text>
    </Checkbox>
  );
}

export default AdvancedMetadataModal;
