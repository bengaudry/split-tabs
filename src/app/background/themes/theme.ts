import { ThemeColor } from "../../../shared/types";
import { Theme, ThemeColors } from "../types";
import { knownThemesColors } from "./knownThemesColors";

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
 * Extracts relevant colors from the theme object
 */
export async function getThemeColors(theme: Theme): Promise<ThemeColors> {
  // Get the current theme
  console.info("[Theme] > Extracting colors from theme: ", theme);

  const activeThemeName = await getActiveThemeName();
  console.info("[Theme] > Active theme name: ", activeThemeName);
  if (activeThemeName && activeThemeName in knownThemesColors) {
    // TODO : if activeThemeName == null, switch on the default theme (dark or light) based on the system preferences
    console.info(`[Theme] > Using known colors for theme: ${activeThemeName}`);
    return knownThemesColors[activeThemeName];
  }

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
