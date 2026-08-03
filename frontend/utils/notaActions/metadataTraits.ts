/**
 * Trait names emitted by the hooks' `tokenURI`. Anything reading hook terms out
 * of metadata goes through here so the parser and the agreement story cannot
 * drift apart when a contract renames a trait.
 */
export const TRAIT = {
  expirationDate: "Expiration Date",
  inspectionEnd: "Inspection End",
  dripAmount: "Drip Amount",
  dripPeriod: "Drip Period",
  lastCashed: "Last Cashed",
  nftAddress: "NFT Address",
  thresholdNumber: "Threshold Number",
  conditionType: "Condition Type",
  sender: "Sender",
} as const;
