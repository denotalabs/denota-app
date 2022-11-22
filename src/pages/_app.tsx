import { useState } from "react";
import { AppProps } from "next/app";

import { ChakraProvider } from "@chakra-ui/react";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import Nav from "../components/Nav";

function MyApp({ Component, pageProps }: AppProps) {
  const [isUser, setIsUser] = useState(true);
  return (
    <ChakraProvider>
      <BlockchainDataProvider>
        <Nav setIsUser={setIsUser} isUser={isUser} />
        <Component {...pageProps} />
      </BlockchainDataProvider>
    </ChakraProvider>
  );
}

export default MyApp;
