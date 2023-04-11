import { Image } from "@chakra-ui/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { deployedChains } from "../../context/chainInfo";

export type NotaCurrency = "DAI" | "USDC" | "WETH" | "USDT" | "NATIVE";

type URLKey = "MATIC" | "CELO" | "USDC" | "DAI" | "WETH" | "USDT";

const URL_MAP = {
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=023",
  DAI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png?v=023",
  WETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=002",
  MATIC: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=024",
  CELO: "https://cryptologos.cc/logos/celo-celo-logo.svg?v=024",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=024",
};

interface Props {
  currency: NotaCurrency;
  sourceChainHex?: string;
}

function CurrencyIcon({ currency, sourceChainHex }: Props) {
  const { blockchainState } = useBlockchainData();

  let currencyKey: URLKey;

  if (currency === "NATIVE") {
    if (sourceChainHex) {
      currencyKey = deployedChains[sourceChainHex].nativeCurrency
        .symbol as URLKey;
    } else {
      if (
        !(
          blockchainState.nativeCurrenySymbol === "MATIC" ||
          blockchainState.nativeCurrenySymbol === "CELO"
        )
      ) {
        return <></>;
      }
      currencyKey = blockchainState.nativeCurrenySymbol;
    }
  } else {
    currencyKey = currency;
  }

  return <Image boxSize="20px" src={URL_MAP[currencyKey]} alt="USDC" />;
}

export default CurrencyIcon;
