import { getUserScheme } from "../utils/colors";
import {
  handleCancelExtensionRating,
  handleExtensionRating,
  showRatingPopupIfAuthorized,
} from "../utils/ratingPopup";
import { Searchbar } from "./lib/Searchbar";
import { SplitView } from "./lib/SplitView";
import { ThemeProvider } from "./lib/ThemeProvider";

// Wait for the split view tab to be fully loaded to avoid issues
// accessing elements and events
document.addEventListener("DOMContentLoaded", () => {
  const splitViewInstance = new SplitView();
  const themeProviderInstance = new ThemeProvider();

  // Listen for messages from the background script
  browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      // Initial url load
      case "LOAD_URLS":
        if (message.leftUrl !== null) {
          splitViewInstance.loadUrl("left", message.leftUrl);
        } else {
          Searchbar.setActiveSide("left");
          Searchbar.forbidClose();
          Searchbar.open({
            splitInstance: splitViewInstance.getInstanceOfSide("left"),
          });
        }

        if (message.rightUrl !== null) {
          splitViewInstance.loadUrl("right", message.rightUrl);
        } else {
          Searchbar.setActiveSide("right");
          Searchbar.forbidClose();
          Searchbar.open({
            splitInstance: splitViewInstance.getInstanceOfSide("right"),
          });
        }
        break;

      // Set the background color if provided
      case "BROWSER_COLORS":
        console.log(message.backgroundColor, typeof message.backgroundColor);
        if (getUserScheme() === "dark")
          themeProviderInstance.resetThemeToDefault();
        else {
          themeProviderInstance.setThemeProperties([
            ["defaultBackgroundColor", message.backgroundColor],
            ["defaultBorderColor", message.inputBorder],
            ["defaultInputBackgroundColor", message.inputBackground],
            ["defaultPrimaryTextColor", message.textColor],
            ["defaultSecondaryTextColor", message.secondaryTextColor],
          ]);
        }
        break;

      // Change the orientation when context menu pressed
      case "SET_ORIENTATION":
        splitViewInstance.setOrientation(message.orientation);
        break;
    }
  });

  /* Extension rating */
  const shownLastTime = localStorage.getItem(
    "has-rating-popup-been-shown-last-time"
  );
  if (shownLastTime === "false") showRatingPopupIfAuthorized();
  if (shownLastTime === "true" || shownLastTime === null) {
    localStorage.setItem("has-rating-popup-been-shown-last-time", "false");
  }

  document
    .getElementById("cancel-rate-extension-btn")
    ?.addEventListener("click", handleCancelExtensionRating);

  document
    .getElementById("rate-extension-btn")
    ?.addEventListener("click", handleExtensionRating);
});
