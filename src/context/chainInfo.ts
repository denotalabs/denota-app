export const AddressMapping = {
  mumbai: {
    crx: "0x7eb1481f5C797ac23FdbE4a193a3Fb702ceDa0aF",
    cheq: "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A",
    dai: "0x982723cb1272271b5ee405A5F14E9556032d9308",
    weth: "0xAA6DA55ba764428e1C4c492c6db5FDe3ccf57332",
    selfSignedBroker: "0xBE1d6e5ed08030402aF3715Ba31c2d7B456d1E3c",
  },
  local: {
    crx: "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A",
    cheq: "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A",
    dai: "0x982723cb1272271b5ee405A5F14E9556032d9308",
    weth: "0x612f8B2878Fc8DFB6747bc635b8B3DeDFDaeb39e",
    selfSignedBroker: "0x8Df6c6fb81d3d1DAAFCd5FD5564038b0d9006FbB",
  },
};

export const mappingForChainId = (chainId: number) => {
  switch (chainId) {
    case 80001:
      return AddressMapping.mumbai;
    case 31337:
      return AddressMapping.local;
    default:
      return AddressMapping.mumbai;
  }
};
