import { updateIcons } from "./icons";
import { TabId, Theme } from "./types";

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

/**
 * Extracts relevant colors from the theme object
 */
export async function getThemeColors(theme: Theme) {
  // Get the current theme
  console.log(theme.colors);

  const backgroundColor = theme.colors?.frame ?? theme.colors?.sidebar_highlight;
  const textColor = theme.colors?.tab_text ?? theme.colors?.toolbar_field_text;
  const inputBorder = theme.colors?.sidebar_border ?? theme.colors?.toolbar_field_border ?? theme.colors?.tab_line;
  const inputBackground = theme.colors?.toolbar_field;
  const secondaryTextColor = theme.colors?.toolbar_field_highlight;

  return {
    backgroundColor,
    textColor,
    inputBorder,
    inputBackground,
    secondaryTextColor
  };
}
