import { useState } from "react";
import { AppProps } from "next/app";

import { ChakraProvider } from "@chakra-ui/react";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import Nav from "../components/Nav";

function MyApp({ Component, pageProps }: AppProps) {
  const [isUser, setIsUser] = useState(true);
  const [isV2, setIsV2] = useState(true);
  return (
    <ChakraProvider>
      <BlockchainDataProvider>
        <Nav
          setIsUser={setIsUser}
          isUser={isUser}
          setIsV2={setIsV2}
          isV2={isV2}
        />
        <Component {...pageProps} />
      </BlockchainDataProvider>
    </ChakraProvider>
  );
}

export default MyApp;
