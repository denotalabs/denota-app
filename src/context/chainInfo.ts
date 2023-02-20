export const AddressMapping = {
  mumbai: {
    cheq: "0x0C5B27CC5595eC1AAf720A538A6490c5aF6FaD64",
    dai: "0x982723cb1272271b5ee405A5F14E9556032d9308",
    weth: "0xAA6DA55ba764428e1C4c492c6db5FDe3ccf57332",
    selfSignedBroker: "0xa9f0CE52c8De7496F7137cF807A6D33df06C2C87",
    directPayModule: "0x378e0262ec639668D0c81d9e0e3D22c861e65968",
    explorer: "https://mumbai.polygonscan.com/tx/",
  },
  local: {
    cheq: "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A",
    dai: "0x982723cb1272271b5ee405A5F14E9556032d9308",
    weth: "0x612f8B2878Fc8DFB6747bc635b8B3DeDFDaeb39e",
    selfSignedBroker: "0x8Df6c6fb81d3d1DAAFCd5FD5564038b0d9006FbB",
    directPayModule: "0xa9f0CE52c8De7496F7137cF807A6D33df06C2C87",
    explorer: "https://mumbai.polygonscan.com/tx/",
  },
};

export const mappingForChainId = (chainId: number) => {
  switch (chainId) {
    case 80001:
      return AddressMapping.mumbai;
    case 31337:
      return AddressMapping.local;
    default:
      return undefined;
  }
};
