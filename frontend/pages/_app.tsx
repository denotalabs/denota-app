import { Box, ChakraProvider } from "@chakra-ui/react";
import "@fontsource/dm-sans/index.css";
import coinbaseModule from "@web3-onboard/coinbase";
import gnosisModule from "@web3-onboard/gnosis";
import injectedModule from "@web3-onboard/injected-wallets";
import { init, Web3OnboardProvider } from "@web3-onboard/react";
// import walletConnectModule from "@web3-onboard/walletconnect";
import { AppProps } from "next/app";
import Head from "next/head";
import SidebarNav from "../components/nav/SidebarNav";
import { BlockchainDataProvider } from "../context/BlockchainDataProvider";
import GoogleAnalytics from "../context/GoogleAnalytics";
import { NotasProvider } from "../context/NotasContext";
import customTheme from "../theme";

const gnosis = gnosisModule();

const coinbase = coinbaseModule();

// const walletConnect = walletConnectModule({
//   version: 2,
//   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
// });

const celoTestnet = {
  id: "0xaef3",
  token: "CELO",
  label: "Celo Alfajores",
  rpcUrl: `https://alfajores-forno.celo-testnet.org`,
};

const polygonTestnet = {
  id: "0x89",
  token: "MATIC",
  label: "Polygon",
  rpcUrl: "https://rpc-mumbai.maticvigil.com",
};

const chains = [celoTestnet, polygonTestnet];
const wallets = [injectedModule(), coinbase, gnosis];

const web3Onboard = init({
  wallets,
  chains,
  appMetadata: {
    name: "Denota",
    description: "Denota demo app",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
  connect: {
    autoConnectAllPreviousWallet: true,
  },
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
  theme: "dark",
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Denota App</title>
        <meta
          name="description"
          content="Supercharged web3 pay for the future of work"
        />
      </Head>
      <GoogleAnalytics measurementId="G-RX5F5Q2B8D" />
      <ChakraProvider theme={customTheme} resetCSS={true}>
        <Web3OnboardProvider web3Onboard={web3Onboard}>
          <BlockchainDataProvider>
            <NotasProvider>
              <Box minH="100vh" bgGradient="linear(to-r, brand.400, brand.500)">
                <SidebarNav>
                  <Component {...pageProps} />
                </SidebarNav>
              </Box>
            </NotasProvider>
          </BlockchainDataProvider>
        </Web3OnboardProvider>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
