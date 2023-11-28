import { Box, ChakraProvider } from "@chakra-ui/react";
import "@fontsource/dm-sans/index.css";
// import walletConnectModule from "@web3-onboard/walletconnect";
import { AppProps } from "next/app";
import Head from "next/head";
import DesktopOnlyPage from "../components/DesktopOnlyPage";
import SidebarNav from "../components/nav/SidebarNav";
import ProtectedPage from "../components/ProtectedPage";
import GoogleAnalytics from "../context/GoogleAnalytics";
import { NotaProvider } from "../context/NotaDataProvider";
import customTheme from "../theme";

function MyApp({ Component, pageProps }: AppProps) {
  // if (!session) {
  //   return <div>Loading...</div>; // or a custom loader
  // }

  return (
    <>
      <Head>
        <title>Denota App</title>
        <meta name="description" content="Coverage and risk transfer demo" />
      </Head>
      <GoogleAnalytics measurementId="G-RX5F5Q2B8D" />
      <ChakraProvider theme={customTheme} resetCSS={true}>
        <Box minH="100vh" bgGradient="linear(to-r, brand.400, brand.500)">
          <DesktopOnlyPage>
            <ProtectedPage>
              <SidebarNav>
                <NotaProvider>
                  <Component {...pageProps} />
                </NotaProvider>
              </SidebarNav>
            </ProtectedPage>
          </DesktopOnlyPage>
        </Box>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
