import type { UnsignedTransactionRequest } from "@privy-io/react-auth";
import { ethers } from "ethers";

export type PrivySendTransactionFn = (
  input: UnsignedTransactionRequest,
  options?: { sponsor?: boolean; address?: string }
) => Promise<{ hash: `0x${string}` }>;

function toQuantity(
  value: ethers.BigNumberish | undefined | null
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return ethers.BigNumber.from(value).toHexString();
}

function toPrivyRequest(
  populated: ethers.providers.TransactionRequest,
  chainId: number
): UnsignedTransactionRequest {
  return {
    chainId,
    to: populated.to ?? undefined,
    data:
      populated.data != null
        ? ethers.utils.hexlify(populated.data)
        : undefined,
    value: toQuantity(populated.value),
    gasLimit: toQuantity(populated.gasLimit),
    gasPrice: toQuantity(populated.gasPrice),
    maxFeePerGas: toQuantity(populated.maxFeePerGas),
    maxPriorityFeePerGas: toQuantity(populated.maxPriorityFeePerGas),
    nonce:
      populated.nonce != null ? Number(populated.nonce) : undefined,
    type: populated.type ?? undefined,
  };
}

function transactionResponseFromHash(
  provider: ethers.providers.Provider,
  hash: string,
  populated: ethers.providers.TransactionRequest,
  from: string,
  chainId: number
): ethers.providers.TransactionResponse {
  return {
    hash,
    confirmations: 0,
    from,
    nonce: populated.nonce ?? 0,
    gasLimit: populated.gasLimit ?? ethers.BigNumber.from(0),
    gasPrice: populated.gasPrice ?? null,
    maxFeePerGas: populated.maxFeePerGas ?? null,
    maxPriorityFeePerGas: populated.maxPriorityFeePerGas ?? null,
    data: populated.data ?? "0x",
    value: populated.value ?? ethers.BigNumber.from(0),
    chainId,
    to: populated.to ?? null,
    wait: (confirmations?: number) =>
      provider.waitForTransaction(hash, confirmations),
  } as ethers.providers.TransactionResponse;
}

/**
 * Ethers signer that routes sendTransaction through Privy with gas sponsorship.
 * Other operations (signMessage, reads, gas estimation) use the underlying wallet.
 */
export function createSponsoredEthersSigner(
  delegate: ethers.providers.JsonRpcSigner,
  sendTransaction: PrivySendTransactionFn,
  options?: { sponsor?: boolean; walletAddress?: string }
): ethers.Signer {
  const provider = delegate.provider;
  if (!provider) {
    throw new Error("Sponsored signer requires a connected provider");
  }

  const sponsor = options?.sponsor ?? true;
  const walletAddress = options?.walletAddress;

  class SponsoredEthersSigner extends ethers.Signer {
    readonly provider: ethers.providers.Provider = provider;

    async getAddress(): Promise<string> {
      return delegate.getAddress();
    }

    async sendTransaction(
      transaction: ethers.providers.TransactionRequest
    ): Promise<ethers.providers.TransactionResponse> {
      const populated = await this.populateTransaction(transaction);
      const network = await provider.getNetwork();
      const from = await this.getAddress();

      const { hash } = await sendTransaction(
        toPrivyRequest(populated, network.chainId),
        { sponsor, address: walletAddress }
      );

      return transactionResponseFromHash(
        provider,
        hash,
        populated,
        from,
        network.chainId
      );
    }

    connect(newProvider: ethers.providers.Provider): ethers.Signer {
      return createSponsoredEthersSigner(
        delegate.connect(newProvider) as ethers.providers.JsonRpcSigner,
        sendTransaction,
        options
      );
    }

    async signMessage(message: ethers.Bytes | string): Promise<string> {
      return delegate.signMessage(message);
    }

    async signTransaction(
      transaction: ethers.providers.TransactionRequest
    ): Promise<string> {
      return delegate.signTransaction(transaction);
    }

    _signTypedData(
      domain: ethers.TypedDataDomain,
      types: Record<string, Array<ethers.TypedDataField>>,
      value: Record<string, unknown>
    ): Promise<string> {
      return delegate._signTypedData(domain, types, value);
    }
  }

  return new SponsoredEthersSigner();
}

export function isPrivyEmbeddedWallet(
  walletClientType: string | undefined
): boolean {
  return walletClientType === "privy" || walletClientType === "privy-v2";
}

export function isGasSponsorshipEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_PRIVY_GAS_SPONSORSHIP?.trim();
  if (flag === "false" || flag === "0") {
    return false;
  }
  return true;
}
