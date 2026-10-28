import { createTheme, defaultVariantColorsResolver } from "@mantine/core";
import classes from "./theme.module.css";

/** Mirrors kaderisasi-web-fe's theme (Inter, blue, md radius, 44px targets). */
export const theme = createTheme({
  fontFamily: "'Inter Variable', Inter, system-ui, sans-serif",
  defaultRadius: "md",
  primaryColor: "blue",
  primaryShade: { light: 8, dark: 6 },
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
    fontWeight: "800",
    sizes: {
      h1: { fontSize: "1.75rem", lineHeight: "1.2" },
      h2: { fontSize: "1.375rem", lineHeight: "1.25" },
      h3: { fontSize: "1.125rem", lineHeight: "1.3" },
      h4: { fontSize: "1rem", lineHeight: "1.35" },
    },
  },
  components: {
    Modal: {
      classNames: { content: classes.modalContent },
      defaultProps: { removeScrollProps: { allowPinchZoom: true } },
    },
    Drawer: {
      defaultProps: { removeScrollProps: { allowPinchZoom: true } },
    },
    Button: {
      classNames: { root: classes.button, label: classes.buttonLabel },
      defaultProps: { size: "md" },
    },
    ActionIcon: { defaultProps: { size: 44 } },
    Badge: { defaultProps: { size: "md" } },
    Title: { defaultProps: { order: 2 } },
    Paper: { defaultProps: { withBorder: true, radius: "md" } },
    Input: {
      classNames: { input: classes.input },
      defaultProps: { size: "md" },
      vars: () => ({ root: { "--input-fz": "16px" } }),
    },
    InputWrapper: { classNames: { label: classes.inputLabel } },
    Tabs: { classNames: { tab: classes.tab } },
    Chip: {
      defaultProps: { size: "md" },
      classNames: { label: classes.chipLabel },
    },
    SegmentedControl: { defaultProps: { size: "md" } },
    TextInput: { defaultProps: { size: "md" } },
    Select: { defaultProps: { size: "md" } },
    NumberInput: { defaultProps: { size: "md" } },
    Textarea: { defaultProps: { size: "md", autosize: true, minRows: 2 } },
    PasswordInput: { defaultProps: { size: "md" } },
    Checkbox: { defaultProps: { size: "md" } },
  },
});
