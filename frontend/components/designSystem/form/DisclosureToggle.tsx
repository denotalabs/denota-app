import { Box, Flex, type FlexProps } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { formTheme } from "./formTheme";

interface Props extends Omit<FlexProps, "onToggle"> {
  label: string;
  open: boolean;
  onToggle: () => void;
}

/** Quiet text button with a chevron that flips when the section is open. */
export function DisclosureToggle({ label, open, onToggle, ...props }: Props) {
  return (
    <Flex
      as="button"
      type="button"
      align="center"
      justify="space-between"
      gap={1.5}
      color={formTheme.mutedLight}
      fontSize="13px"
      fontWeight={600}
      aria-expanded={open}
      _hover={{ color: formTheme.textDark }}
      onClick={onToggle}
      {...props}
    >
      <span>{label}</span>
      <Box
        as="span"
        display="inline-flex"
        transition="transform 0.15s"
        transform={open ? "rotate(180deg)" : undefined}
      >
        <ChevronDown size={16} />
      </Box>
    </Flex>
  );
}
