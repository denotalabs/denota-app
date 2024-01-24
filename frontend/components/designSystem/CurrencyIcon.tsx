import { Image } from "@chakra-ui/react";

export type NotaCurrency = "DAI" | "USDC" | "WETH" | "USDT" | "USDCE";

const URL_MAP = {
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=023",
  USDCE: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=023",
  DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png?v=023",
  WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=002",
  MATIC: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=024",
  CELO: "https://cryptologos.cc/logos/celo-celo-logo.svg?v=024",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=024",
};

interface Props {
  currency: NotaCurrency;
}

function CurrencyIcon({ currency }: Props) {
  return <Image boxSize="20px" src={URL_MAP[currency]} alt="USDC" />;
}

export default CurrencyIcon;
