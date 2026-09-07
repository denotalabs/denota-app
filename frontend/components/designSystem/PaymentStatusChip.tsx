import {
  CheckCircleIcon,
  TimeIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import { Tag, Spinner } from "@chakra-ui/react";
import {
  NotaDisplayStatus,
  NotaStatusTone,
} from "../../utils/notaStatus";
import { notaInfoTheme as t } from "./notaInfoTheme";

const STATUS_TONE_STYLES: Record<
  NotaStatusTone,
  { icon: typeof TimeIcon; color: string; bg: string }
> = {
  pending: { icon: TimeIcon, color: t.primaryLight, bg: t.primaryDim },
  settled: {
    icon: CheckCircleIcon,
    color: "green.600",
    bg: "rgba(72,187,120,0.14)",
  },
  expired: {
    icon: WarningIcon,
    color: "orange.600",
    bg: "rgba(237,137,54,0.14)",
  },
};

interface Props {
  status?: NotaDisplayStatus | null;
}

export function PaymentStatusChip({ status }: Props) {
  if (!status) {
    return (
      <Spinner
        size="sm"
        thickness="2px"
        color={t.muted}
        aria-label="Loading payment status"
      />
    );
  }

  const { icon: Icon, color, bg } = STATUS_TONE_STYLES[status.tone];

  return (
    <Tag
      fontSize="11.5px"
      px="11px"
      py={1}
      borderRadius="full"
      bg={bg}
      color={color}
      border="0.5px solid"
      borderColor={t.line}
      whiteSpace="nowrap"
    >
      <Icon boxSize={3} mr={1} />
      {status.label}
    </Tag>
  );
}
