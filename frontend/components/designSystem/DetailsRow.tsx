import {
  CopyIcon,
  ExternalLinkIcon,
  QuestionOutlineIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Flex,
  HStack,
  Link,
  Text,
  Tooltip,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { useFormatAddress } from "../../hooks/useFormatAddress";

function formatTime(seconds: number) {
  const years = Math.floor(seconds / 31536000);
  seconds %= 31536000;
  const months = Math.floor(seconds / 2592000);
  seconds %= 2592000;
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const timeParts = [];

  if (years > 0) {
    timeParts.push(`${years}y`);
  }
  if (months > 0) {
    timeParts.push(`${months}m`);
  }
  if (days > 0) {
    timeParts.push(`${days}d`);
  }
  if (hours > 0) {
    timeParts.push(`${hours}h`);
  }
  if (minutes > 0) {
    timeParts.push(`${minutes}m`);
  }
  if (seconds > 0) {
    timeParts.push(`${seconds}s`);
  }

  return timeParts.join(' ');
}

interface Props {
  title: string;
  value: any;
  link?: string | null;
  tooltip?: string;
  copyValue?: string;
  fontColor?: string;
  /** When false, show full addresses on desktop-style layouts. Default true. */
  shortenAddresses?: boolean;
}

function DetailsRow({
  title,
  value,
  link,
  tooltip,
  copyValue,
  fontColor,
  shortenAddresses = true,
}: Props) {
  const { onCopy } = useClipboard(copyValue ?? "");
  const toast = useToast();
  const { formatAddress } = useFormatAddress();

  title = title.charAt(0).toUpperCase() + title.slice(1)
  if (value !== null && value !== undefined) {
    if (BigNumber.isBigNumber(value)) {
      if (title === "DripAmount") {
        value = value.toString();
        // ethers.utils.formatUnits(Number(value), 6)  // TODO need to format this using the nota.token decimals
      } else if (title === "DripPeriod") {
        value = formatTime(Number(value) / 1000).toString();
      }
    } else if (typeof value === "string") {
      if (value.match(/^http?:\/\//) || value.match(/^ipfs:\/\//)) {
        value = value.charAt(0).toUpperCase() + value.slice(1);
      } else if (isAddress(value)) {
        value = formatAddress(value, { shorten: shortenAddresses });
      }
    } else if (value instanceof Date) {
      value = value.toDateString();
    } else {
      value = value.toString();
    }
  }

  return (
    <Box py={3} w="100%">
      <Flex direction="row" justifyContent="space-between" maxW="100%">
        <Text
          fontWeight={600}
          fontSize="md"
          textAlign="left"
          flexShrink={0}
          noOfLines={1}
          color={fontColor}
        >
          {title}
        </Text>
        <HStack minWidth={0} pl={4}>
          <Text
            fontWeight={200}
            fontSize="md"
            textAlign="right"
            noOfLines={shortenAddresses ? 1 : undefined}
            wordBreak={shortenAddresses ? undefined : "break-all"}
            color={fontColor}
          >
            {value}
          </Text>

          {tooltip && (
            <Tooltip
              label={tooltip}
              aria-label="module tooltip"
              placement="right"
            >
              <QuestionOutlineIcon ml={2} mb={1} />
            </Tooltip>
          )}
          {copyValue && (
            <Tooltip label="Copy address" placement="top" shouldWrapChildren>
              <CopyIcon
                cursor="pointer"
                onClick={() => {
                  onCopy();
                  toast({
                    title: "Address copied",
                    status: "success",
                    duration: 1000,
                    isClosable: true,
                  });
                }}
              />
            </Tooltip>
          )}
          {link && (
            <Tooltip label="View on block explorer" placement="top" shouldWrapChildren>
              <Link
                href={link}
                isExternal
                aria-label="View on block explorer"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                color="blue.500"
                borderWidth="1px"
                borderColor="blue.500"
                borderRadius="sm"
                p={0.5}
                lineHeight={0}
                _hover={{ bg: "blue.50", textDecoration: "none" }}
              >
                <ExternalLinkIcon boxSize={3.5} />
              </Link>
            </Tooltip>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}

export default DetailsRow;
