import { Box, Button, Flex, Tag, Text } from "@chakra-ui/react";
import { Pencil, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formTheme } from "../../designSystem/form/formTheme";
import { termsTheme } from "./termsTheme";

interface IconTileProps {
  icon: LucideIcon;
  active: boolean;
  size?: number;
}

export function TermIconTile({ icon: Icon, active, size = 36 }: IconTileProps) {
  return (
    <Flex
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="10px"
      align="center"
      justify="center"
      flexShrink={0}
      bg={active ? "brand.200" : "brand.400"}
      color={active ? "brand.100" : formTheme.mutedLight}
    >
      <Icon size={Math.round(size * 0.5)} strokeWidth={2.25} />
    </Flex>
  );
}

interface FullCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onSelect: () => void;
}

/** Unselected outcome: icon tile, title, one-line subtitle. */
export function TermCard({ title, subtitle, icon, onSelect }: FullCardProps) {
  return (
    <Box
      as="button"
      type="button"
      w="100%"
      textAlign="left"
      display="flex"
      alignItems="center"
      gap={3.5}
      px={4}
      py={3.5}
      bg={termsTheme.cardBg}
      border={termsTheme.hairline}
      borderRadius={termsTheme.cardRadius}
      transition="border-color 0.15s, background 0.15s"
      _hover={{ borderColor: "notaPurple.100", bg: "brand.400" }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "brand.200",
        outlineOffset: "2px",
      }}
      onClick={onSelect}
    >
      <TermIconTile icon={icon} active={false} />
      <Box minW={0}>
        <Text fontSize="15px" fontWeight={700} color={formTheme.textDark}>
          {title}
        </Text>
        <Text
          fontSize="13px"
          lineHeight={1.45}
          color={formTheme.mutedLight}
          noOfLines={1}
        >
          {subtitle}
        </Text>
      </Box>
    </Box>
  );
}

interface SlimRowProps {
  title: string;
  icon: LucideIcon;
  onSelect: () => void;
}

/** Demoted outcome: a single slim line the person can switch to directly. */
export function TermSlimRow({ title, icon: Icon, onSelect }: SlimRowProps) {
  return (
    <Box
      as="button"
      type="button"
      w="100%"
      textAlign="left"
      display="flex"
      alignItems="center"
      gap={2.5}
      px={3}
      py={2}
      minH="40px"
      bg="transparent"
      border={termsTheme.hairline}
      borderRadius="12px"
      color={formTheme.mutedLight}
      transition="border-color 0.15s, color 0.15s"
      _hover={{ borderColor: "notaPurple.100", color: formTheme.textDark }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "brand.200",
        outlineOffset: "2px",
      }}
      onClick={onSelect}
    >
      <Icon size={16} strokeWidth={2.25} />
      <Text fontSize="14px" fontWeight={600} noOfLines={1}>
        {title}
      </Text>
    </Box>
  );
}

interface PromotedCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tag?: string | null;
  onChange: () => void;
  children: ReactNode;
}

/** The selected outcome, expanded with its configuration. */
export function PromotedTermCard({
  title,
  subtitle,
  icon,
  tag,
  onChange,
  children,
}: PromotedCardProps) {
  return (
    <Box
      w="100%"
      bg={termsTheme.cardBg}
      borderRadius={termsTheme.cardRadius}
      px={{ base: 3.5, md: 4 }}
      py={4}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Flex align="center" gap={3.5} minW={0}>
          <TermIconTile icon={icon} active />
          <Box minW={0}>
            <Flex align="center" gap={2} flexWrap="wrap">
              <Text fontSize="15px" fontWeight={700} color={formTheme.textDark}>
                {title}
              </Text>
              {tag ? (
                <Tag size="sm" colorScheme="purple" borderRadius="full">
                  {tag}
                </Tag>
              ) : null}
            </Flex>
            <Text
              fontSize="13px"
              lineHeight={1.45}
              color={formTheme.mutedLight}
            >
              {subtitle}
            </Text>
          </Box>
        </Flex>
        <Button
          flexShrink={0}
          variant="ghost"
          size="sm"
          color="brand.200"
          leftIcon={<Pencil size={14} />}
          onClick={onChange}
          _hover={{ bg: "brand.400" }}
        >
          Change
        </Button>
      </Flex>
      <Box mt={4}>{children}</Box>
    </Box>
  );
}
