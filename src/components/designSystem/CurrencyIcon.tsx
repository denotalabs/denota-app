import { Image } from "@chakra-ui/react";

export type CheqCurrency = "DAI" | "USDC" | "WETH";

const URL_MAP = {
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=023",
  DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png?v=023",
  WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=002",
};

interface Props {
  currency: CheqCurrency;
}

function CurrencyIcon({ currency }: Props) {
  return (
    <Image
      borderRadius="full"
      boxSize="20px"
      src={URL_MAP[currency]}
      alt="USDC"
    />
  );
}

export default CurrencyIcon;
