import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const cheqTheme = extendTheme({
  config,
  components: {
    Checkbox: {
      baseStyle: {
        control: {
          _checked: {
            bg: "cheqPurple.100",
            borderColor: "cheqPurple.100",
            color: "white",
            _hover: {
              bg: "cheqPurple.100",
            },
          },
          _hover: {
            borderColor: "cheqPurple.100",
          },
        },
      },
    },
  },
  fonts: {
    body: `DM Sans, sans-serif`,
    heading: `DM Sans, sans-serif`,
    mono: "DM Sans, monospace",
  },
  shadows: { outline: "0 !important" },
  colors: {
    success: {
      100: "#4A90E2",
    },
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
