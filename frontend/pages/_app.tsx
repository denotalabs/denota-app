import { Box, ChakraProvider } from "@chakra-ui/react";
import { PrivyProvider } from "@privy-io/react-auth";
import { AppProps } from "next/app";
import Head from "next/head";
import SidebarNav from "../components/nav/SidebarNav";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import GoogleAnalytics from "../context/GoogleAnalytics";
import { NotasProvider } from "../context/NotasContext";
import { TokenListProvider } from "../context/TokenListProvider";
import { PRIVY_APP_ID, privyConfig } from "../context/privyConfig";
import customTheme from "../theme";

function AppProviders({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    console.warn(
      "NEXT_PUBLIC_PRIVY_APP_ID is not set. Wallet login will not work."
    );
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      {children}
    </PrivyProvider>
  );
}

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
        <AppProviders>
          <BlockchainDataProvider>
            <TokenListProvider>
              <NotasProvider>
                <Box
                  minH="100vh"
                  bgGradient="linear(to-r, brand.400, brand.500)"
                >
                  <SidebarNav>
                    <Component {...pageProps} />
                  </SidebarNav>
                </Box>
              </NotasProvider>
            </TokenListProvider>
          </BlockchainDataProvider>
        </AppProviders>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
