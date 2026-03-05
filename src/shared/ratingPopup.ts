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
  const isUnauthorized = localStorage.getItem("stop-showing-rating-popup");
  if (Boolean(isUnauthorized)) return;
  showRatingPopup();
}

/** Hides the rating popup in future uses */
const askToStopShowingRatingPopup = () => {
  localStorage.setItem("stop-showing-rating-popup", "true");
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
      type: "REQUEST_OPEN_EXTERNAL_URL",
      url: "https://addons.mozilla.org/fr/firefox/addon/split-tabs/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search"
    });
  } finally {
    hideRatingPopup();
  }
}
