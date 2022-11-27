import { useState } from "react";
import { AppProps } from "next/app";

import { ChakraProvider } from "@chakra-ui/react";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import Nav from "../components/legacy/Nav";
import ResponsiveNav from "../components/ResponsiveNav";

function MyApp({ Component, pageProps }: AppProps) {
  const [isUser, setIsUser] = useState(true);
  return (
    <ChakraProvider>
      <BlockchainDataProvider>
        <ResponsiveNav setIsUser={setIsUser} isUser={isUser} />
        <Component {...pageProps} />
      </BlockchainDataProvider>
    </ChakraProvider>
  );
}

export default MyApp;
