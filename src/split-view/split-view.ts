import {
  changeCssVariableValue,
  getRgbValuesFromBackgroundColor,
} from "./lib/colors";
import { MIN_VIEW_PERCENTAGE } from "./lib/constants";
import {
  handleCancelExtensionRating,
  handleExtensionRating,
  showRatingPopupIfAuthorized,
} from "./lib/ratingPopup";
import { Searchbar } from "./lib/Searchbar";
import { Split } from "./lib/Split";

// ===== GLOBAL VARIABLES ===== //
type Orientation = "horizontal" | "vertical";
let orientation: Orientation = "horizontal";

/**
 * Changes the orientation to `newOrientation` if provided, or toggles the
 * orientation if `newOrientation` param is undefined
 */
function changeOrientation(newOrientation?: Orientation) {
  if (!newOrientation) {
    // toggle orientation
    orientation = "horizontal" === orientation ? "vertical" : "horizontal";
  } else {
    // set orientation with defined value
    orientation = newOrientation;
  }
  changeCssVariableValue(
    "--view-orientation",
    "vertical" === orientation ? "column" : "row"
  );
  document.body?.classList.toggle("horizontal", "horizontal" === orientation);
  document.body?.classList.toggle("vertical", "vertical" === orientation);

  return orientation;
}

// Wait for the split view tab to be fully loaded to avoid issues
// accessing elements and events
document.addEventListener("DOMContentLoaded", () => {
  Searchbar.initialize();

  let leftSplit: Split = new Split(null, 50, "left");
  let rightSplit: Split = new Split(null, 50, "right");

  // Listen for messages from the background script
  browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      // Initial url load
      case "LOAD_URLS":
        if (message.leftUrl !== null) {
          console.info("Loading left url");
          leftSplit.loadUrl(message.leftUrl);
        } else {
          Searchbar.setActiveSide("left");
          Searchbar.open(leftSplit);
        }

        if (message.rightUrl !== null) {
          console.info("Loading right url");
          rightSplit.loadUrl(message.rightUrl);
        } else {
          Searchbar.setActiveSide("right");
          Searchbar.open(rightSplit);
        }
        break;

      // Set the background color if provided
      case "BROWSER_COLORS":
        changeCssVariableValue(
          "--main-background-color",
          getRgbValuesFromBackgroundColor(message.backgroundColor)
        );
        changeCssVariableValue(
          "--primary-text-color",
          getRgbValuesFromBackgroundColor(message.textColor)
        );
        changeCssVariableValue(
          "--secondary-text-color",
          getRgbValuesFromBackgroundColor(message.secondaryTextColor)
        );
        break;

      // Change the orientation when context menu pressed
      case "SET_ORIENTATION":
        changeOrientation(message.orientation);
        break;
    }
  });

  /* ====== RESIZING ===== */
  let isUserResizingViews = false;
  const resizeDraggable = document.getElementById("resize-draggable");

  resizeDraggable?.addEventListener("mousedown", () => {
    isUserResizingViews = true;
  });
  resizeDraggable?.addEventListener("mouseup", () => {
    isUserResizingViews = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (isUserResizingViews && e.buttons == 1) {
      // check if the user is pressing the mouse btn
      const leftPercent = Math.round(
        orientation === "horizontal"
          ? (e.pageX * 100) / window.innerWidth
          : (e.pageY * 100) / window.innerHeight
      );
      const rightPercent = 100 - leftPercent;
      if (
        leftPercent >= MIN_VIEW_PERCENTAGE &&
        rightPercent >= MIN_VIEW_PERCENTAGE
      ) {
        leftSplit.updateSize(leftPercent);
        rightSplit.updateSize(rightPercent);
      }
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
