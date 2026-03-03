import { updateIcons } from "./icons";
import { TabId, Theme, ThemeColors } from "./types";

/**
 * Sends the theme colors to the split view page, so that it can adapt its colors to match the browser theme.
 * @param tabId the id of the tab containing the split view
 * @param theme the theme (got from browser.theme.getCurrent()) to extract colors from
 */
export async function sendThemeToFront(tabId: TabId, theme: Theme) {
  const themeColors = await getThemeColors(theme);

  // Send the BROWSER_COLORS data to the split-view page
  browser.tabs.sendMessage(tabId, {
    type: "BROWSER_COLORS",
    ...themeColors
  });

  updateIcons(tabId);
}

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
 * Extracts relevant colors from the theme object
 */
export async function getThemeColors(theme: Theme): Promise<ThemeColors> {
  // Get the current theme
  console.log(theme.colors);

  const backgroundColor = theme.colors?.frame ?? theme.colors?.sidebar_highlight;
  const textColor = theme.colors?.tab_text ?? theme.colors?.toolbar_field_text;
  const inputBorder = theme.colors?.sidebar_border ?? theme.colors?.toolbar_field_border ?? theme.colors?.tab_line;
  const inputBackground = theme.colors?.toolbar_field;
  const secondaryTextColor = theme.colors?.toolbar_field_highlight;

  return {
    backgroundColor: themeColorToCssColor(backgroundColor) ?? "#ffffff",
    textColor: themeColorToCssColor(textColor) ?? "#000",
    inputBorder: themeColorToCssColor(inputBorder) ?? "#ccc",
    inputBackground: themeColorToCssColor(inputBackground) ?? "#222",
    secondaryTextColor: themeColorToCssColor(secondaryTextColor) ?? "#ccc"
  };
}
