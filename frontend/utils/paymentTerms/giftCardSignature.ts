import { ethers } from "ethers";

/**
 * The nota doesn't exist until the write lands, so a signature previewed on
 * the terms screen is bound to this placeholder id instead of the real one.
 */
export const PREVIEW_NOTA_ID = 0;

/**
 * Digest the GiftCard hook recovers against (`GiftCard.sign`). An empty
 * message uses the signature-only overload, matching `_recoverSigner`.
 */
export function giftCardSignDigest(
  registrarAddress: string,
  notaId: number,
  message: string
): string {
  const encoded = message
    ? ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "string"],
        [registrarAddress, notaId, message]
      )
    : ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [registrarAddress, notaId]
      );
  return ethers.utils.keccak256(encoded);
}

/**
 * Signs the gift card digest with the connected wallet. `signMessage` adds the
 * EIP-191 prefix the hook applies via `toEthSignedMessageHash`.
 */
export async function signGiftCardMessage(
  signer: ethers.Signer,
  registrarAddress: string,
  notaId: number,
  message: string
): Promise<string> {
  const digest = giftCardSignDigest(registrarAddress, notaId, message);
  return signer.signMessage(ethers.utils.arrayify(digest));
}
