import { Box, ChakraProvider } from "@chakra-ui/react";
import "@fontsource/dm-sans/index.css";
import { AppProps } from "next/app";
import { useState } from "react";
import ResponsiveNav from "../components/nav/ResponsiveNav";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import customTheme from "../theme";

function MyApp({ Component, pageProps }: AppProps) {
  const [isUser, setIsUser] = useState(true);

  return (
    <ChakraProvider theme={customTheme} resetCSS={true}>
      <BlockchainDataProvider>
        <Box minH="100vh" bgGradient="linear(to-r, brand.400, brand.500)">
          <ResponsiveNav setIsUser={setIsUser} isUser={isUser} />
          <Component {...pageProps} />
        </Box>
      </BlockchainDataProvider>
    </ChakraProvider>
  );
}

export default MyApp;
