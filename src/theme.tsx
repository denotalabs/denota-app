import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const cheqTheme = extendTheme({
  config,
  fonts: {
    body: `DM Sans, sans-serif`,
    heading: `DM Sans, sans-serif`,
    mono: "DM Sans, monospace",
  },
  colors: {
    brand: {
      100: "#0E111B",
      200: "#5981F3",
      300: "#202C4F",
      400: "#1C203A",
      500: "#282D59",
      600: "#141A29",
    },
    cheqPurple: {
      100: "#7476D3",
    },
  },
});

const customTheme = cheqTheme;

export default customTheme;
