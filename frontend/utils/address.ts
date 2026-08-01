/** Shorten an address for display: 0x1234…abcd. */
export function truncateAddress(address: string): string {
  if (!address || address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
