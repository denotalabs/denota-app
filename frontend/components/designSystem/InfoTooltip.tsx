import { QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";

interface Props {
  label: string;
  placement?: "top" | "right" | "bottom" | "left";
}

function InfoTooltip({ label, placement = "right" }: Props) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const icon = (
    <Icon
      as={QuestionOutlineIcon}
      ml={2}
      mb={1}
      boxSize={3.5}
      cursor="help"
      display="inline"
      aria-label={label}
      tabIndex={0}
    />
  );

  if (isMobile) {
    return (
      <Popover placement={placement} trigger="click">
        <PopoverTrigger>{icon}</PopoverTrigger>
        <PopoverContent bg="brand.400" borderColor="brand.500" maxW="xs">
          <PopoverBody fontSize="sm">{label}</PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip
      label={label}
      aria-label={label}
      placement={placement}
      shouldWrapChildren
    >
      {icon}
    </Tooltip>
  );
}

export default InfoTooltip;
