import { ThemeColor } from "../../shared/types";
import { Theme, ThemeColors } from "./types";

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

/**
 * Extracts relevant colors from the theme object
 */
export async function getThemeColors(theme: Theme): Promise<ThemeColors> {
  // Get the current theme
  console.info("[Theme] > Extracting colors from theme: ", theme);

  const backgroundColor = bestColorOf([theme.colors?.frame, theme.colors?.sidebar_highlight]);
  const textColor = bestColorOf([theme.colors?.tab_text, theme.colors?.toolbar_field_text]);
  const borderColor = bestColorOf([theme.colors?.toolbar_field_border, theme.colors?.tab_line, theme.colors?.toolbar]);
  const activeBorderColor = bestColorOf([
    theme.colors?.popup_border,
    theme.colors?.icons,
    theme.colors?.sidebar_border
  ]);
  const inputBackground = bestColorOf([theme.colors?.toolbar_field]);
  const secondaryTextColor = bestColorOf([theme.colors?.toolbar_field_highlight]);
  const iconsColor = bestColorOf([theme.colors?.icons]);

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
