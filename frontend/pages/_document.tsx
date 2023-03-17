import { ColorModeScript } from "@chakra-ui/react";
import { Head, Html, Main, NextScript } from "next/document";
import customTheme from "../theme";

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RX5F5Q2B8D"
        ></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RX5F5Q2B8D');
          `}
        </script>
      </Head>
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
