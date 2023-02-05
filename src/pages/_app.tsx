import { useState } from "react";
import { AppProps } from "next/app";

import { ChakraProvider, Box } from "@chakra-ui/react";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import ResponsiveNav from "../components/nav/ResponsiveNav";
import customTheme from "../theme";

function MyApp({ Component, pageProps }: AppProps) {
  const [isUser, setIsUser] = useState(true);

  return (
    <ChakraProvider theme={customTheme} resetCSS={true}>
      <BlockchainDataProvider>
        <Box minH="100vh" bgGradient='linear(to-r, brand.400, brand.500)'>
        <ResponsiveNav setIsUser={setIsUser} isUser={isUser} />
        <Component {...pageProps} />
        </Box>
      </BlockchainDataProvider>
    </ChakraProvider>
  );
}

export default MyApp;
