import { useState } from "react";
import { AppProps } from "next/app";

import { ChakraProvider } from "@chakra-ui/react";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import ResponsiveNav from "../components/nav/ResponsiveNav";
import { extendTheme } from "@chakra-ui/react";
import "../style.css";

function MyApp({ Component, pageProps }: AppProps) {
  const [isUser, setIsUser] = useState(true);

  const theme = extendTheme({
    config: {
      initialColorMode: "dark",
      useSystemColorMode: false,
    },
  });

  return (
    <ChakraProvider theme={theme} resetCSS={true}>
      <BlockchainDataProvider>
        <ResponsiveNav setIsUser={setIsUser} isUser={isUser} />
        <Component {...pageProps} />
      </BlockchainDataProvider>
    </ChakraProvider>
  );
}

export default MyApp;
