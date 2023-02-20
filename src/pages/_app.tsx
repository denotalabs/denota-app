import { Box, ChakraProvider } from "@chakra-ui/react";
import "@fontsource/dm-sans/index.css";
import { AppProps } from "next/app";
import SidebarNav from "../components/nav/SidebarNav";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import { CheqsProvider } from "../context/CheqsContext";
import customTheme from "../theme";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={customTheme} resetCSS={true}>
      <BlockchainDataProvider>
        <CheqsProvider>
          <Box minH="100vh" bgGradient="linear(to-r, brand.400, brand.500)">
            <SidebarNav>
              <Component {...pageProps} />
            </SidebarNav>
          </Box>
        </CheqsProvider>
      </BlockchainDataProvider>
    </ChakraProvider>
  );
}

export default MyApp;
