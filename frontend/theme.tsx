import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

/** Neutral scale reused for leftover Chakra blue/purple colorSchemes. */
const zinc = {
  50: "#FAFAFA",
  100: "#F4F4F5",
  200: "#E4E4E7",
  300: "#D4D4D8",
  400: "#A1A1AA",
  500: "#71717A",
  600: "#52525B",
  700: "#3F3F46",
  800: "#27272A",
  900: "#18181B",
};

const notaTheme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: "brand.100",
        color: "gray.900",
      },
    },
  },
  components: {
    Checkbox: {
      baseStyle: {
        control: {
          borderColor: "gray.300",
          _checked: {
            bg: "brand.200",
            borderColor: "brand.200",
            color: "brand.100",
            _hover: {
              bg: "brand.200",
            },
          },
          _hover: {
            borderColor: "brand.200",
          },
        },
      },
    },
  },
  fonts: {
    body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`,
  },
  shadows: { outline: "0 !important" },
  colors: {
    success: {
      100: "#16A34A",
    },
    brand: {
      100: "#FFFFFF",
      200: "#111111",
      300: "#F4F4F5",
      400: "#F4F4F5",
      500: "#E4E4E7",
      600: "#FAFAFA",
    },
    notaPurple: {
      100: "#71717A",
    },
    blue: zinc,
    purple: zinc,
  },
});

const customTheme = notaTheme;

export default customTheme;
