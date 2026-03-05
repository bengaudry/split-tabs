import { ThemeColor } from "../types";
import { ThemeColors } from "./types";
import { BrowserTheme } from "../../app/background/types";
import { knownThemesColors } from "./knownThemesColors";

/** Returns the user's preferred color scheme */
export function getPrefferedUserScheme(): "dark" | "light" {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/**
 * Converts a theme color value, which can be in various formats (string, number, RGB array), to a CSS color string.
 * It handles different formats of theme colors, including hex strings, numeric values, and RGB arrays, ensuring that the resulting color is in a valid CSS format.
 * @param themeColor the theme color value to convert, which can be a string (e.g., "#ff0000"), a number (e.g., 0xff0000), or an RGB array (e.g., [255, 0, 0]).
 * @returns the CSS color string corresponding to the input theme color. If the input format is unrecognized, it returns undefined.
 */
function themeColorToCssColor(themeColor: any): string | undefined {
  if (typeof themeColor === "string") {
    return themeColor;
  } else if (typeof themeColor === "number") {
    // Convert the number to a hex color string
    return "#" + themeColor.toString(16).padStart(6, "0");
  } else if (Array.isArray(themeColor) && themeColor.length >= 3) {
    // Convert the RGB array to a hex color string
    return (
      "#" +
      themeColor[0].toString(16).padStart(2, "0") +
      themeColor[1].toString(16).padStart(2, "0") +
      themeColor[2].toString(16).padStart(2, "0")
    );
  }
  return undefined;
}

/**
 * Finds the best color from an array of theme colors, ignoring null, undefined and transparent values.
 * The order of the colors in the array represents their priority, with the first valid color being returned.
 * @param colors an array of theme colors to choose from, which can be in various formats (string, number, RGB array) and may include null, undefined or "transparent" values that should be ignored.
 * @returns the best color found in the array. If no valid color is found, it returns null.
 */
function bestColorOf(colors: (ThemeColor | null | undefined)[]): ThemeColor | null {
  for (const color of colors) {
    if (color && color !== "transparent") {
      return color;
    }
  }
  return null;
}

async function getActiveThemeName() {
  try {
    const addons = await browser.management.getAll();
    const activeTheme = addons.find((addon) => addon.type === "theme" && addon.enabled);
    return activeTheme ? activeTheme.name : null;
  } catch (error) {
    console.error("[Theme] > Error fetching active theme: ", error);
    return null;
  }
}

/**
 * Generates a ThemeColors object by extracting and converting colors from the given browser theme.
 * @param theme the browser theme object from which to extract colors. This object typically contains a "colors" property with various color values used in the browser's UI.
 * @returns a ThemeColors object containing CSS color strings for different UI elements, derived from the input theme. If certain colors cannot be extracted, it falls back to default values to ensure the extension's UI remains visually consistent with the browser theme.
 */
function generateThemeColorsFromBrowserTheme(theme: BrowserTheme): ThemeColors {
  const { colors } = theme;

  const backgroundColor = bestColorOf([colors?.frame, colors?.frame_inactive, colors?.accentcolor]);
  const textColor = bestColorOf([colors?.toolbar_field_text]);
  const borderColor = bestColorOf([colors?.toolbar_field_border]);
  const activeBorderColor = bestColorOf([colors?.popup_border, colors?.icons, colors?.sidebar_border]);
  const inputBackground = bestColorOf([colors?.toolbar_field, backgroundColor]);
  const secondaryTextColor = bestColorOf([colors?.toolbar_field_highlight]);
  const iconsColor = bestColorOf([colors?.toolbar_field_text, colors?.toolbar_field_text_focus, colors?.toolbar_text]);

  return {
    backgroundColor: themeColorToCssColor(backgroundColor) ?? "#ffffff",
    textColor: themeColorToCssColor(textColor) ?? "#000",
    borderColor: themeColorToCssColor(borderColor) ?? "#ccc",
    activeBorderColor: themeColorToCssColor(activeBorderColor) ?? "#ccc",
    inputBackground: themeColorToCssColor(inputBackground) ?? "#222",
    secondaryTextColor: themeColorToCssColor(secondaryTextColor) ?? "#ccc",
    iconsColor: themeColorToCssColor(iconsColor) ?? "#000"
  };
}

/**
 * Generates a themeColors object based on the current browser theme.
 * It first tries to match the active theme with a list of known themes to use predefined colors.
 * If the active theme is not recognized, it extracts colors from the browser's theme using the Theme API,
 * applying heuristics to determine the best colors for different UI elements.
 * This ensures that the extension's UI remains visually consistent with the user's chosen browser theme,
 * even if it's an unknown or custom theme.
 */
export async function getThemeColors(theme?: BrowserTheme): Promise<ThemeColors> {
  const activeThemeName = await getActiveThemeName();
  if (activeThemeName && activeThemeName in knownThemesColors) {
    // TODO : if activeThemeName == null, switch on the default theme (dark or light) based on the system preferences
    console.info(`[Theme] > Using known colors for theme: ${activeThemeName}`);
    return knownThemesColors[activeThemeName];
  }

  if (!theme) {
    try {
      theme = await browser.theme.getCurrent();
    } catch (error) {
      console.error("[Theme] > Error fetching current theme: ", error);
      return knownThemesColors["Light"]; // fallback to light theme colors
      // TODO : fallback to dark or light theme colors based on the system preferences
    }
  }
  console.info(`[Theme] > Unknown theme ${activeThemeName}. Extracting colors from theme: `, theme);
  return generateThemeColorsFromBrowserTheme(theme);
}
