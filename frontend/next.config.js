const path = require("path");

/** Stub optional Privy peer deps that Denota does not use. */
const privyOptionalStub = path.join(__dirname, "lib/privy-optional-stub.js");

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
    "@lifi/widget",
    "@lifi/wallet-management",
    "@privy-io/react-auth",
  ],
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": privyOptionalStub,
      "@solana/kit": privyOptionalStub,
      "@solana-program/memo": privyOptionalStub,
      "@solana-program/system": privyOptionalStub,
      "@solana-program/token": privyOptionalStub,
      "@stripe/crypto": privyOptionalStub,
    };
    return config;
  },
};