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
      variant: "expandable" as WidgetVariant,
      subvariant: "default",
      // walletManagement: {
      //   signer: blockchainState.signer,
      //   connect: async () => {
      //     return blockchainState.signer;
      //   },
      //   disconnect: async () => {
      //     console.log("disconnect");
      //   },
      // },
      // containerStyle: {
      //   borderRadius: "12px",
      //   boxShadow:
      //     "0px 2px 4px rgba(0, 0, 0, 0.08), 0px 8px 16px rgba(0, 0, 0, 0.16)",
      // },
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
