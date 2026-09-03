import { Box, Flex, IconButton, Input, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  attachmentDisplayName,
  validateAttachmentLink,
} from "../../../utils/attachmentLink";
import {
  type AttachmentStorageSettings,
  DEFAULT_ATTACHMENT_STORAGE_SETTINGS,
} from "../../../utils/attachmentStorage";
import { FormInputWrap } from "../../designSystem/form/FormInputWrap";
import { formTheme } from "../../designSystem/form/formTheme";
import { AdvancedMetadataModal } from "./AdvancedMetadataModal";
import { AttachmentStorageFooter } from "./AttachmentStorageFooter";
import { FileUploadButton } from "./FileUpload";

export type AttachmentKind = "document" | "image";

type AttachmentFormValues = {
  externalURI: string;
  imageURI: string;
  attachmentStorage?: AttachmentStorageSettings;
};

const STORAGE_FIELD = "attachmentStorage";

const KIND_FIELD: Record<AttachmentKind, keyof AttachmentFormValues> = {
  document: "externalURI",
  image: "imageURI",
};

const KIND_UPLOAD_KEY: Record<AttachmentKind, "ipfsHash" | "imageURI"> = {
  document: "ipfsHash",
  image: "imageURI",
};

const KIND_OPTIONS: { value: AttachmentKind; label: string }[] = [
  { value: "document", label: "Document" },
  { value: "image", label: "Image" },
];

const PLACEHOLDER: Record<AttachmentKind, string> = {
  document: "Document URL",
  image: "Image URL",
};

const HELPER_TEXT =
  "Paste a link and press enter to attach. Visible to the recipient.";
const INVALID_TEXT = "That doesn't look like a valid link. Check the URL.";

const ROW_MIN_HEIGHT = { base: "56px", md: "50px" };
const UPLOAD_SIZE = { base: "40px", md: "36px" };

type PerKind<T> = Record<AttachmentKind, T>;

/** Attached links currently held in the form, keyed by kind ("" when none). */
export function useAttachedLinks(): PerKind<string> {
  const { values } = useFormikContext<AttachmentFormValues>();
  return {
    document: values.externalURI?.trim() ?? "",
    image: values.imageURI?.trim() ?? "",
  };
}

export function MetadataAttachmentField() {
  const { values, setFieldValue } = useFormikContext<AttachmentFormValues>();
  const attached = useAttachedLinks();
  const storageSettings =
    values.attachmentStorage ?? DEFAULT_ATTACHMENT_STORAGE_SETTINGS;
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [kind, setKind] = useState<AttachmentKind>("document");
  const [drafts, setDrafts] = useState<PerKind<string>>({
    document: "",
    image: "",
  });
  const [errors, setErrors] = useState<PerKind<string | null>>({
    document: null,
    image: null,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusAfterRemove = useRef(false);

  const attachedValue = attached[kind];
  const draft = drafts[kind];
  const error = errors[kind];

  useEffect(() => {
    if (!attachedValue && focusAfterRemove.current) {
      focusAfterRemove.current = false;
      inputRef.current?.focus();
    }
  }, [attachedValue]);

  const setDraft = (value: string) =>
    setDrafts((prev) => ({ ...prev, [kind]: value }));
  const setError = (value: string | null) =>
    setErrors((prev) => ({ ...prev, [kind]: value }));

  const attach = () => {
    if (!draft.trim()) {
      return;
    }
    const value = validateAttachmentLink(draft);
    if (!value) {
      setError(INVALID_TEXT);
      return;
    }
    setError(null);
    setDraft("");
    setFieldValue(KIND_FIELD[kind], value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      attach();
    }
  };

  const handleRemove = () => {
    focusAfterRemove.current = true;
    setFieldValue(KIND_FIELD[kind], "");
  };

  const openAdvanced = () => setIsAdvancedOpen(true);
  const applyStorageSettings = (settings: AttachmentStorageSettings) => {
    setFieldValue(STORAGE_FIELD, settings, false);
  };

  return (
    <Box>
      <Flex
        role="radiogroup"
        aria-label="Attachment type"
        display="inline-flex"
        bg={formTheme.iconInactiveBg}
        borderRadius="10px"
        p="3px"
        mb={3}
      >
        {KIND_OPTIONS.map((option) => {
          const isSelected = option.value === kind;
          return (
            <Box
              key={option.value}
              as="button"
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setKind(option.value)}
              px={3}
              py={1}
              fontSize="13px"
              fontWeight={600}
              borderRadius="8px"
              bg={isSelected ? formTheme.primaryButtonBg : "transparent"}
              color={isSelected ? formTheme.text : formTheme.muted}
              transition="background 0.15s ease, color 0.15s ease"
              _hover={{ color: formTheme.text }}
            >
              {option.label}
            </Box>
          );
        })}
      </Flex>

      {attachedValue ? (
        /* Upload settings don't apply to an attached link, so no footer here. */
        <Flex
          align="center"
          gap={2}
          bg="green.900"
          border="1px solid"
          borderColor="green.700"
          borderRadius="12px"
          pl={3}
          pr={1.5}
          py={1.5}
          color="green.100"
          fontSize="14px"
          fontWeight={600}
          minW={0}
        >
          <Box color="green.300" flexShrink={0} display="flex">
            <CircleCheck size={16} strokeWidth={2.25} />
          </Box>
          <Text
            as="span"
            flex={1}
            minW={0}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            title={attachedValue}
          >
            {attachmentDisplayName(attachedValue)}
          </Text>
          <IconButton
            aria-label="Remove attachment"
            variant="unstyled"
            size="xs"
            minW="24px"
            h="24px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="6px"
            color="green.200"
            _hover={{ bg: "green.800", color: "white" }}
            icon={<X size={14} strokeWidth={2.5} />}
            onClick={handleRemove}
          />
        </Flex>
      ) : (
        <>
          {/* One bordered box: input row on top, storage footer below. */}
          <FormInputWrap
            direction="column"
            align="stretch"
            gap={0}
            px={0}
            pl={0}
            minH="auto"
            overflow="hidden"
            borderState={error ? "invalid" : "default"}
          >
            <Flex
              align="center"
              gap={2}
              pl={{ base: 4, md: 4 }}
              pr={{ base: 2, md: 1.5 }}
              minH={ROW_MIN_HEIGHT}
            >
              <Input
                ref={inputRef}
                flex={1}
                minW={0}
                variant="unstyled"
                h={{ base: "54px", md: "48px" }}
                fontSize={{ base: "17px", md: "15px" }}
                color={formTheme.text}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                name={KIND_FIELD[kind]}
                placeholder={PLACEHOLDER[kind]}
                value={draft}
                aria-invalid={!!error}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (error) {
                    setError(null);
                  }
                }}
                onKeyDown={handleKeyDown}
                onBlur={attach}
              />
              <FileUploadButton
                name={KIND_FIELD[kind]}
                uploadValueKey={KIND_UPLOAD_KEY[kind]}
                buttonProps={{
                  w: UPLOAD_SIZE,
                  h: UPLOAD_SIZE,
                  minW: UPLOAD_SIZE,
                  minH: UPLOAD_SIZE,
                  borderRadius: "10px",
                }}
              />
            </Flex>
            <AttachmentStorageFooter
              settings={storageSettings}
              onOpenSettings={openAdvanced}
            />
          </FormInputWrap>
          {error ? (
            <Flex
              align="center"
              gap={1.5}
              mt={2}
              color={formTheme.error}
              fontSize="13px"
              role="alert"
            >
              <CircleAlert size={14} strokeWidth={2.25} />
              <Text as="span">{error}</Text>
            </Flex>
          ) : (
            <Text mt={2} fontSize="13px" color={formTheme.muted}>
              {HELPER_TEXT}
            </Text>
          )}
        </>
      )}
      <AdvancedMetadataModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        value={storageSettings}
        onApply={applyStorageSettings}
      />
    </Box>
  );
}

export default MetadataAttachmentField;
