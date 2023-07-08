import {
  HiddenUI,
  LiFiWidget,
  WidgetConfig,
  WidgetVariant,
} from "@lifi/widget";
import { useMemo } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";

export const LifiWidget = () => {
  const { blockchainState } = useBlockchainData();

  const widgetConfig: WidgetConfig = useMemo((): WidgetConfig => {
    return {
      // TODO: configure
      fromChain: 137,
      toChain: 10,
      fromToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      toToken: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      fromAmount: 10,
      variant: "expandable" as WidgetVariant,
      subvariant: "default",
      walletManagement: {
        signer: blockchainState.signer,
        connect: async () => {
          return blockchainState.signer;
        },
        disconnect: async () => {
          console.log("disconnect");
        },
      },
      containerStyle: {
        borderRadius: "12px",
        boxShadow:
          "0px 2px 4px rgba(0, 0, 0, 0.08), 0px 8px 16px rgba(0, 0, 0, 0.16)",
      },
      appearance: "dark",
      hiddenUI: [HiddenUI.Appearance, HiddenUI.Language, HiddenUI.PoweredBy],
      keyPrefix: `denota`,
      buildUrl: true,
      insurance: true,
      integrator: "denota",
    };
  }, [blockchainState.signer]);

  return <LiFiWidget config={widgetConfig} integrator="denota" />;
};
