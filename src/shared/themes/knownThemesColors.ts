import { ThemeColors } from "../../shared/themes/types";

export const knownThemesColors: Record<string, ThemeColors> = {
  // default Firefox dark theme
  Dark: {
    backgroundColor: "#1f1e25",
    textColor: "#fbfbfe",
    borderColor: "#52525e",
    activeBorderColor: "#218fa6",
    inputBackground: "#141318",
    secondaryTextColor: "#858589",
    iconsColor: "#eeeef1"
  },
  // default Firefox light theme
  Light: {
    backgroundColor: "#f0f0f4",
    textColor: "#39383e",
    borderColor: "#cbcbce",
    activeBorderColor: "#7fb0ef",
    inputBackground: "#e8e8ec",
    secondaryTextColor: "#9f9ea2",
    iconsColor: "#4c4b51"
  },
  // https://addons.mozilla.org/en-US/firefox/addon/perfectdarktheme/?utm_content=addons-manager-reviews-link&utm_medium=firefox-browser&utm_source=firefox-browser
  "Dark Theme": {
    backgroundColor: "#121212",
    textColor: "#fbfbfe",
    borderColor: "#1e1e1e",
    activeBorderColor: "#178697",
    inputBackground: "#1e1e1e",
    secondaryTextColor: "#87868b",
    iconsColor: "#cccccc"
  },
  // https://addons.mozilla.org/en-US/firefox/addon/catppuccin-mocha-blue-git/
  "Catppuccin Mocha - Blue": {
    backgroundColor: "#11111b",
    textColor: "#c5ceeb",
    borderColor: "#37384a",
    activeBorderColor: "#89b4fa",
    inputBackground: "#1e1e2e",
    secondaryTextColor: "#bbc3e0",
    iconsColor: "#bbc3e0"
  }
};
