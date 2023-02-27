import { ColorModeScript } from "@chakra-ui/react";
import { Head, Html, Main, NextScript } from "next/document";
import customTheme from "../theme";

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <ColorModeScript
          initialColorMode={customTheme.config.initialColorMode}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
