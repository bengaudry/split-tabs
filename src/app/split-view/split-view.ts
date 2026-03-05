import {
  handleCancelExtensionRating,
  handleExtensionRating,
  showRatingPopupIfAuthorized
} from "shared/misc/ratingPopup";
import { Searchbar } from "./lib/Searchbar";
import { SplitContext } from "./lib/SplitContext";
import { SplitView } from "./lib/SplitView";
import { ThemeProvider } from "./lib/ThemeProvider";

// Wait for the split view tab to be fully loaded to avoid issues
// accessing elements and events
document.addEventListener("DOMContentLoaded", () => {
  const splitViewInstance = SplitView.getInstance();
  const searchbarInstance = Searchbar.getInstance();
  const themeProviderInstance = new ThemeProvider();

  const context = SplitContext.getInstance();
  context.addObserver(themeProviderInstance);
  context.addObserver(splitViewInstance);

  // Listen for messages from the background script
  browser.runtime.onMessage.addListener((message) => {
    console.info("[split-view.ts] > Received message:", message);

    if (message.sender === "background") {
      console.info("[split-view.ts] > Received message from background:", message);
      context.updateFromBackgroundEvent(message.event);
    }

    // open searchbar when initializing the extension in order to open the second split
    if (message.event?.type === "INIT_EXTENSION") {
      console.log(message.event);
      const awaitingUrlSide = message.event.side === "left" ? "right" : "left";
      context.updateOrientation(message.event.orientation);
      context.setActiveSide(awaitingUrlSide);
      searchbarInstance.forbidClose();
      searchbarInstance.open({
        splitInstance: splitViewInstance.getInstanceOfSide(awaitingUrlSide)
      });
    }
  });

  /* Extension rating */
  const shownLastTime = localStorage.getItem("has-rating-popup-been-shown-last-time");
  if (shownLastTime === "false") showRatingPopupIfAuthorized();
  if (shownLastTime === "true" || shownLastTime === null) {
    localStorage.setItem("has-rating-popup-been-shown-last-time", "false");
  }

  document.getElementById("cancel-rate-extension-btn")?.addEventListener("click", handleCancelExtensionRating);

  document.getElementById("rate-extension-btn")?.addEventListener("click", handleExtensionRating);
});
