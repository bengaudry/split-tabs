const showRatingPopup = () => {
  const ratingPopup = document.getElementById("rating-suggestion-box");
  ratingPopup?.setAttribute("data-visible", "true");
  localStorage.setItem("has-rating-popup-been-shown-last-time", "true");
};
const hideRatingPopup = () => {
  const ratingPopup = document.getElementById("rating-suggestion-box");
  ratingPopup?.setAttribute("data-visible", "false");
};

export async function showRatingPopupIfAuthorized() {
  const response = await browser.runtime.sendMessage({
    type: "GET_SETTING",
    key: "show-rating-popup",
  });
  if (response.type === "SETTING_VALUE" && response.value === "false") return;
  showRatingPopup();
}

/** Hides the rating popup in future uses */
const askToStopShowingRatingPopup = () => {
  browser.runtime.sendMessage({
    type: "EDIT_SETTINGS",
    key: "show-rating-popup",
    value: false,
  });
};

/**
 * The function triggered when pressing 'Cancel rate' button in popup
 */
export function handleCancelExtensionRating() {
  const stopShowingPopupCheckbox = document.querySelector<HTMLInputElement>("#stop-showing-rating-popup-checkbox");

  if (stopShowingPopupCheckbox?.checked) {
    askToStopShowingRatingPopup();
  }

  hideRatingPopup();
}

/**
 * The function triggered when pressing 'Rate' button in popup
 */
export async function handleExtensionRating() {
  try {
    askToStopShowingRatingPopup();

    await browser.runtime.sendMessage({
      type: "OPEN_EXTERNAL_URL",
      url: "https://addons.mozilla.org/fr/firefox/addon/split-tabs/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search",
    });
  } finally {
    hideRatingPopup();
  }
}
