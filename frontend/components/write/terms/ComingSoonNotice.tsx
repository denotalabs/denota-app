import type { HookMaturity } from "../../../utils/paymentTerms/resolveHook";

interface Props {
  maturity: HookMaturity;
}

/**
 * Shown when the current answers resolve to a hook this app cannot send yet.
 * Deliberately names no contract; it only tells the person how to proceed.
 */
export function ComingSoonNotice({ maturity }: Props) {
  if (maturity === "live") {
    return null;
  }
  const lead =
    maturity === "proposed"
      ? "This option is still being designed"
      : maturity === "experimental"
        ? "This option is experimental and not available to send yet"
        : "This option isn't available to send yet";
  // return (
  //   <Flex
  //     mt={4}
  //     px={3.5}
  //     py={3}
  //     gap={2.5}
  //     align="flex-start"
  //     bg="brand.400"
  //     border={termsTheme.hairline}
  //     borderRadius="10px"
  //   >
  //     <Flex color={formTheme.mutedLight} mt="2px" flexShrink={0}>
  //       <Info size={15} strokeWidth={2.25} />
  //     </Flex>
  //     <Text fontSize="13px" lineHeight={1.5} color={formTheme.mutedLight}>
  //       {lead}. Pick a different answer above to continue, or switch to another
  //       term.
  //     </Text>
  //   </Flex>
  // );
}
