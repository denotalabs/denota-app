import { Box, ChakraProvider } from "@chakra-ui/react";
import "@fontsource/dm-sans/index.css";

import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  sepolia,
  celo,
} from 'wagmi/chains';
import Head from "next/head";
import SidebarNav from "../components/nav/SidebarNav";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import GoogleAnalytics from "../context/GoogleAnalytics";
import { NotasProvider } from "../context/NotasContext";
import customTheme from "../theme";
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';

const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'fa9ba0c0034d06f75cb37c38446b0ac6',
  chains: [
    mainnet,
    polygon,
    celo,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Denota App</title>
        <meta
          name="description"
          content="Putting trust back into crypto payments."
        />
      </Head>
      <GoogleAnalytics measurementId="G-RX5F5Q2B8D" />
      <ChakraProvider theme={customTheme} resetCSS={true}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={client}>
            <RainbowKitProvider initialChain={polygon}>
              {/* <BlockchainDataProvider> */}
                <NotasProvider>
                  <Box minH="100vh" bgGradient="linear(to-r, brand.400, brand.500)">
                    <SidebarNav>
                      <Component {...pageProps} />
                    </SidebarNav>
                  </Box>
                </NotasProvider>
              {/* </BlockchainDataProvider> */}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ChakraProvider>
      </>
      );
}

      export default MyApp;
