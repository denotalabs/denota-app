import { Box, Collapse, Flex, Tag, Text } from "@chakra-ui/react";
import { useState } from "react";
import type { SpecializedOption } from "../../../utils/paymentTerms/types";
import { DisclosureToggle } from "../../designSystem/form/DisclosureToggle";
import { formTheme } from "../../designSystem/form/formTheme";
import { SPECIALIZED_CATALOG } from "./termCatalog";
import { termsTheme } from "./termsTheme";

interface Props {
  onSelect: (option: Exclude<SpecializedOption, "">) => void;
}

/**
 * Collapsed disclosure for instrument-like and experimental options. Hidden
 * entirely once a term is selected so it never crowds a configuration.
 */
export function SpecializedOptions({ onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Box mt={2}>
      <DisclosureToggle
        label="More specialized options"
        open={open}
        onToggle={() => setOpen((value) => !value)}
        w="100%"
        px={1}
        py={2}
      />
      <Collapse in={open} animateOpacity>
        <Flex direction="column" gap={2} pt={1}>
          {SPECIALIZED_CATALOG.map((option) => {
            const Icon = option.icon;
            const disabled = Boolean(option.comingSoon);
            return (
              <Box
                key={option.id}
                as="button"
                type="button"
                w="100%"
                textAlign="left"
                display="flex"
                alignItems="center"
                gap={3}
                px={3}
                py={2.5}
                bg="transparent"
                border={termsTheme.hairline}
                borderRadius="12px"
                opacity={disabled ? 0.5 : 1}
                cursor={disabled ? "not-allowed" : "pointer"}
                disabled={disabled}
                _hover={
                  disabled ? undefined : { borderColor: "notaPurple.100" }
                }
                _focusVisible={{
                  outline: "2px solid",
                  outlineColor: "brand.200",
                  outlineOffset: "2px",
                }}
                onClick={() => onSelect(option.id)}
              >
                <Flex color={formTheme.mutedLight} flexShrink={0}>
                  <Icon size={16} strokeWidth={2.25} />
                </Flex>
                <Box minW={0} flex={1}>
                  <Flex align="center" gap={2} flexWrap="wrap">
                    <Text
                      fontSize="14px"
                      fontWeight={600}
                      color={formTheme.text}
                    >
                      {option.title}
                    </Text>
                    {option.comingSoon ? (
                      <Tag
                        size="sm"
                        variant="subtle"
                        colorScheme="purple"
                        borderRadius="full"
                        fontSize="10px"
                      >
                        Coming soon
                      </Tag>
                    ) : null}
                    {option.advanced ? (
                      <Tag
                        size="sm"
                        variant="subtle"
                        colorScheme="gray"
                        borderRadius="full"
                        fontSize="10px"
                      >
                        Advanced
                      </Tag>
                    ) : null}
                  </Flex>
                  <Text fontSize="12px" color={formTheme.muted} noOfLines={1}>
                    {option.subtitle}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Flex>
      </Collapse>
    </Box>
  );
}
