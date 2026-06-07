const DEFAULT_GATEWAY = "gateway.pinata.cloud";

/** Resolve IPFS URI or raw CID to an HTTP gateway URL. */
export function ipfsToHttpUrl(uriOrCid: string): string {
  if (uriOrCid.startsWith("http://") || uriOrCid.startsWith("https://")) {
    return uriOrCid;
  }
  const cid = uriOrCid.startsWith("ipfs://") ? uriOrCid.slice(7) : uriOrCid;
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/^https?:\/\//, "") ??
    DEFAULT_GATEWAY;
  return `https://${gateway}/ipfs/${cid}`;
}
