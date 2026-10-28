import {
  createTheme,
  defaultVariantColorsResolver,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";
import classes from "./theme.module.css";

/**
 * Beasiswa Perintis design system (canvas "Beasiswa Perintis Design System").
 * Mantine's palette names are kept so components pick the brand up as-is:
 * blue = sky/blue/navy, yellow = gold, gray = slate, teal/green = success,
 * violet = navy labels.
 */
export const BRAND = {
  navy900: "#0F3E86",
  blue700: "#1F5FB8",
  sky500: "#2F7DD1",
  sky300: "#8EC3EE",
  sky50: "#EAF4FC",
  ink900: "#0B1F3F",
  gold400: "#F5B731",
  gold200: "#FFD66B",
  orange600: "#D9700C",
  green600: "#2E9E57",
  red600: "#D2452B",
  slate500: "#4A5B78",
  line: "#DCE6F2",
  inputLine: "#B9CBE2",
} as const;

const blue: MantineColorsTuple = [
  "#EAF4FC",
  "#DCEBFA",
  "#B9D7F3",
  "#8EC3EE",
  "#5FA3E2",
  "#3E8BD9",
  "#2F7DD1",
  "#1F5FB8",
  "#174E9F",
  "#0F3E86",
];
const gold: MantineColorsTuple = [
  "#FFF8E8",
  "#FFF4D6",
  "#FFE8A8",
  "#FFD66B",
  "#F9C74B",
  "#F7BE3D",
  "#F5B731",
  "#F5B731",
  "#B8841A",
  "#7A5200",
];
const orange: MantineColorsTuple = [
  "#FFF1E5",
  "#FFE3CC",
  "#FCC799",
  "#F7A862",
  "#F08F3A",
  "#E8801F",
  "#DF7713",
  "#D9700C",
  "#B25A08",
  "#8A4504",
];
const green: MantineColorsTuple = [
  "#E3F4EA",
  "#CDEBD8",
  "#A3DAB7",
  "#74C691",
  "#4FB574",
  "#3BA964",
  "#33A25C",
  "#2E9E57",
  "#227F45",
  "#17663A",
];
const red: MantineColorsTuple = [
  "#FDE8E4",
  "#FAD2CA",
  "#F4A897",
  "#EC7C64",
  "#E25E43",
  "#DA5035",
  "#D54A30",
  "#D2452B",
  "#B23620",
  "#9A2A16",
];
const slate: MantineColorsTuple = [
  "#F6F9FC",
  "#EEF2F8",
  "#DCE6F2",
  "#B9CBE2",
  "#93A6C2",
  "#6F82A0",
  "#5A6B88",
  "#4A5B78",
  "#2A3A55",
  "#0B1F3F",
];
const navy: MantineColorsTuple = [
  "#E6EEF9",
  "#CCDCF2",
  "#99B8E4",
  "#6694D6",
  "#3F76C4",
  "#2A63B3",
  "#1D539F",
  "#0F3E86",
  "#0C3270",
  "#08255A",
];

export const theme = createTheme({
  fontFamily:
    "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, sans-serif",
  fontFamilyMonospace: "ui-monospace, monospace",
  defaultRadius: "md",
  primaryColor: "blue",
  primaryShade: { light: 7, dark: 6 },
  colors: {
    blue,
    yellow: gold,
    orange,
    green,
    teal: green,
    red,
    gray: slate,
    violet: navy,
    grape: navy,
  },
  radius: { xs: "6px", sm: "10px", md: "16px", lg: "20px", xl: "999px" },
  spacing: { xs: "8px", sm: "12px", md: "16px", lg: "20px", xl: "32px" },
  respectReducedMotion: true,
  autoContrast: true,
  variantColorResolver: (input) => {
    const colors = defaultVariantColorsResolver(input);
    if (input.variant !== "light") return colors;
    return {
      ...colors,
      color: `light-dark(color-mix(in srgb, ${colors.color} 80%, black), ${colors.color})`,
    };
  },
  headings: {
    fontFamily: "Montserrat, 'Plus Jakarta Sans Variable', sans-serif",
    fontWeight: "800",
    sizes: {
      h1: { fontSize: "1.75rem", lineHeight: "1.1" },
      h2: { fontSize: "1.375rem", lineHeight: "1.2" },
      h3: { fontSize: "1.0625rem", lineHeight: "1.3" },
      h4: { fontSize: "0.9375rem", lineHeight: "1.35" },
    },
  },
  components: {
    Modal: {
      classNames: { content: classes.modalContent, title: classes.modalTitle },
      defaultProps: {
        removeScrollProps: { allowPinchZoom: true },
        radius: "lg",
      },
    },
    Drawer: {
      defaultProps: { removeScrollProps: { allowPinchZoom: true } },
    },
    Button: {
      classNames: { root: classes.button, label: classes.buttonLabel },
      defaultProps: { size: "md", radius: "xl" },
    },
    ActionIcon: { defaultProps: { size: 44, radius: "xl" } },
    Badge: { defaultProps: { size: "md", radius: "xl" } },
    Title: { defaultProps: { order: 2 } },
    Paper: {
      classNames: { root: classes.paper },
      defaultProps: { withBorder: true, radius: "md" },
    },
    Alert: {
      classNames: { root: classes.alert, title: classes.alertTitle },
      defaultProps: { radius: "md" },
    },
    Input: {
      classNames: { input: classes.input },
      defaultProps: { size: "md", radius: "12px" },
      vars: () => ({ root: { "--input-fz": "16px" } }),
    },
    InputWrapper: { classNames: { label: classes.inputLabel } },
    Tabs: { classNames: { tab: classes.tab } },
    Chip: {
      defaultProps: { size: "md", radius: "xl" },
      classNames: { label: classes.chipLabel },
    },
    SegmentedControl: { defaultProps: { size: "md", radius: "xl" } },
    Progress: { defaultProps: { radius: "xl" } },
    TextInput: { defaultProps: { size: "md" } },
    Select: { defaultProps: { size: "md" } },
    NativeSelect: { defaultProps: { size: "md" } },
    NumberInput: { defaultProps: { size: "md" } },
    Textarea: { defaultProps: { size: "md", autosize: true, minRows: 2 } },
    PasswordInput: { defaultProps: { size: "md" } },
    Checkbox: { defaultProps: { size: "md", radius: "sm" } },
    Radio: { defaultProps: { size: "md" } },
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-text": BRAND.ink900,
    "--mantine-color-dimmed": BRAND.slate500,
    "--mantine-color-placeholder": "#6F82A0",
    "--mantine-color-default-border": BRAND.inputLine,
  },
  dark: {},
});
