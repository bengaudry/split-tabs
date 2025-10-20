import {
  changeCssVariableValue,
  getRgbValuesFromBackgroundColor,
  invertRgbValues,
} from "./lib/colors";
import { MIN_VIEW_PERCENTAGE } from "./lib/constants";
import { createCompositeFavicon } from "./lib/favicon";
import {
  handleCancelExtensionRating,
  handleExtensionRating,
  showRatingPopupIfAuthorized,
} from "./lib/ratingPopup";
import {
  addProtocolToUrl,
  filterIncorrectTabs,
  getUrlBase,
  isUrlLike,
} from "./lib/urls";

// ===== GLOBAL VARIABLES ===== //
type Orientation = "horizontal" | "vertical";
let orientation: Orientation = "horizontal";

let g_leftUrl = "";
let g_rightUrl = "";

let leftPaneIcon: string | null = null;
let rightPaneIcon: string | null = null;

let activeSide: "left" | "right" = "left";

/**
 * Changes the orientation to `newOrientation` if provided, or toggles the
 * orientation if `newOrientation` param is undefined
 * @param {"horizontal" | "vertical" | undefined} newOrientation
 * @returns {"horizontal" | "vertical"} the new orientation
 */
function changeOrientation(newOrientation: Orientation) {
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
  // iframe refs
  const leftPaneIframe =
    document.querySelector<HTMLIFrameElement>("#left-pane-iframe");
  const rightPaneIframe =
    document.querySelector<HTMLIFrameElement>("#right-pane-iframe");

  // toolbar toggles refs
  const leftPaneShortenedUrlBtn = document.querySelector<HTMLButtonElement>(
    "#left-pane-shortened-url-btn"
  );
  const rightPaneShortenedUrlBtn = document.querySelector<HTMLButtonElement>(
    "#right-pane-shortened-url-btn"
  );

  // refresh buttons refs
  const leftPaneRefreshBtn = document.querySelector<HTMLButtonElement>(
    "#left-pane-refresh-btn"
  );
  const rightPaneRefreshBtn = document.querySelector<HTMLButtonElement>(
    "#right-pane-refresh-btn"
  );

  // close buttons refs
  const leftPaneCloseBtn = document.querySelector<HTMLButtonElement>(
    "#left-pane-close-split-btn"
  );
  const rightPaneCloseBtn = document.querySelector<HTMLButtonElement>(
    "#right-pane-close-split-btn"
  );

  const searchbarWrapper =
    document.querySelector<HTMLDivElement>("#searchbar-wrapper");
  const searchbarInput = document.querySelector<HTMLInputElement>(
    "#searchbar-url-input"
  );

  /** Sends a message to the iframe to get the url, the icon and the colors of the tab */
  const requestIframeData = (side: "left" | "right") => {
    const targetIframe = "left" === side ? leftPaneIframe : rightPaneIframe;
    if (!targetIframe?.src) return;
    if (!targetIframe?.contentWindow) return;
    targetIframe.contentWindow.postMessage(
      { type: "IFRAME_DATA" },
      targetIframe.src
    );
  };

  /** Update both tabs if the url is not undefined */
  function updateTabs(
    updatedLeftUrl: string | undefined,
    updatedRightUrl: string | undefined
  ) {
    g_leftUrl = updatedLeftUrl || g_leftUrl;
    g_rightUrl = updatedRightUrl || g_rightUrl;

    browser.runtime.sendMessage({
      type: "UPDATE_TABS",
      updatedLeftUrl: g_leftUrl,
      updatedRightUrl: g_rightUrl,
    });

    if (updatedLeftUrl) {
      const updatedLeftUrlObj = new URL(updatedLeftUrl);
      if (leftPaneShortenedUrlBtn)
        leftPaneShortenedUrlBtn.textContent = updatedLeftUrlObj.hostname;
    }

    if (updatedRightUrl) {
      const updatedRightUrlObj = new URL(updatedRightUrl);
      if (rightPaneShortenedUrlBtn)
        rightPaneShortenedUrlBtn.textContent = updatedRightUrlObj.hostname;
    }
  }

  /** Function to load a URL in an iframe */
  function loadUrl(
    side: "left" | "right",
    url: string | null,
    isRefreshing: boolean = false
  ) {
    if (url === null) return;
    url = addProtocolToUrl(url);

    if ("left" === side) {
      // avoid refreshing when url is same
      if (g_leftUrl === url && !isRefreshing) return;
      if (leftPaneIframe) leftPaneIframe.src = url;
      g_leftUrl = url;
    }

    if ("right" === side) {
      // avoid refreshing when url is same
      if (g_rightUrl === url && !isRefreshing) return;
      if (rightPaneIframe) rightPaneIframe.src = url;
      g_rightUrl = url;
    }

    updateTabs(g_leftUrl, g_rightUrl);
    requestIframeData(side);
    closeSearchbar();
  }

  function reverseTabs() {
    let oldLeftUrl = g_leftUrl;
    loadUrl("left", g_rightUrl, false);
    loadUrl("right", oldLeftUrl, false);
  }

  // Listen for messages from the background script
  browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      // Initial url load
      case "LOAD_URLS":
        if (message.leftUrl !== null) {
          console.info("Loading left url");
          loadUrl("left", message.leftUrl);
          requestIframeData("left");
        } else {
          activeSide = "left";
          populateToolbarLinkContainer();
          openSearchbar();
        }

        if (message.rightUrl !== null) {
          console.info("Loading right url");
          loadUrl("right", message.rightUrl);
          requestIframeData("right");
        } else {
          activeSide = "right";
          populateToolbarLinkContainer();
          openSearchbar();
        }
        break;

      // Move left tab to the right and right tab to the left
      case "REVERSE_TABS":
        reverseTabs();
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

  /* ===== SEARCHBAR VISIBILITY HANDLING ===== */
  /** Open the searchbar and set the default URL if provided */
  function openSearchbar(defaultUrl?: string) {
    searchbarWrapper?.setAttribute("data-expanded", "true");
    if (searchbarInput) {
      searchbarInput.value = defaultUrl || "";
      searchbarInput.focus();
      searchbarInput.select();
    }
  }

  function closeSearchbar() {
    searchbarWrapper?.setAttribute("data-expanded", "false");
  }

  /**
   * Make a query with the search engine or open a url in the split-view
   * when the search bar receives validation (Enter key or blur)
   */
  function handleSearchBarEndInput(side: "left" | "right", query: string) {
    if (query === "") return; // avoid setting a new tab if the user has just discarded the searchbar
    if (isUrlLike(query)) {
      loadUrl(side, query);
    } else {
      const googleUrl = new URL("https://www.google.com/search");
      googleUrl.searchParams.set("q", query);
      loadUrl(side, googleUrl.toString());
    }
    if (searchbarInput) searchbarInput.value = "";
  }

  /** Fetches browser opened tabs and creates links to them
   *  inside the toolbar
   */
  async function populateToolbarLinkContainer() {
    try {
      const response = await browser.runtime.sendMessage({
        type: "FETCH_TABS",
      });

      if (response.type !== "TABS_DATA") return;

      const toolbarLinksContainer =
        searchbarWrapper?.querySelector<HTMLUListElement>(
          ".toolbar-links-container"
        );
      if (toolbarLinksContainer) toolbarLinksContainer.innerHTML = ""; // Clear existing links

      const tabs = filterIncorrectTabs(response.tabs).sort(
        (a, b) => a.lastAccessed - b.lastAccessed
      );

      for (let i = 1; i <= tabs.length; i++) {
        const tab = tabs[i - 1];

        const button = document.createElement("button");
        button.id = `toolbar-link-${i}`;
        button.className = "toolbar-tab-link";

        const img = document.createElement("img");
        img.src = tab.favIconUrl;
        const txtSpan = document.createElement("span");
        txtSpan.textContent = tab.title;

        button.appendChild(img);
        button.appendChild(txtSpan);

        button.addEventListener("click", () => {
          loadUrl(activeSide, tab.url);
        });
        if (toolbarLinksContainer) toolbarLinksContainer.appendChild(button);
      }
    } catch (err) {
      console.error(err);
    }
  }

  /* ====== EVENT HANDLING ====== */

  // == SEARCHBAR == //
  // Open searchbar when left or right trigger is clicked
  leftPaneShortenedUrlBtn?.addEventListener("click", () => {
    activeSide = "left";
    populateToolbarLinkContainer();
    openSearchbar(g_leftUrl);
  });

  rightPaneShortenedUrlBtn?.addEventListener("click", () => {
    activeSide = "right";
    populateToolbarLinkContainer();
    openSearchbar(g_rightUrl);
  });

  // Change panes urls on input blurs or Enter key press
  searchbarInput?.addEventListener("blur", () => {
    handleSearchBarEndInput(activeSide, searchbarInput.value);
  });
  searchbarInput?.addEventListener("keyup", (e) => {
    if (e.code === "Enter")
      handleSearchBarEndInput(activeSide, searchbarInput.value);
  });

  // Close searchbar on pressing escape or clicking away
  document
    .getElementById("searchbar-close-trigger")
    ?.addEventListener("click", closeSearchbar);

  // Close panes when pressing Esc
  document.addEventListener("keyup", (e) => {
    if (e.code === "Escape") closeSearchbar();
  });

  // == REFRESH SIDE == //
  leftPaneRefreshBtn?.addEventListener("click", () => {
    loadUrl("left", g_leftUrl, true);
  });
  rightPaneRefreshBtn?.addEventListener("click", () => {
    loadUrl("right", g_rightUrl, true);
  });

  // == CLOSE SPLIT == //
  // Handling closing split view
  leftPaneCloseBtn?.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "CLOSE_SPLIT", keep: "right" });
  });
  rightPaneCloseBtn?.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "CLOSE_SPLIT", keep: "left" });
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
        changeCssVariableValue(
          "--left-pane-view-percentage",
          `${leftPercent}%`
        );
        changeCssVariableValue(
          "--right-pane-view-percentage",
          `${rightPercent}%`
        );
      }
    }
  });

  /* HANDLING IFRAMES */
  // Function to ask the iframes for their URLs and icons
  // and update the tabs accordingly

  leftPaneIframe?.addEventListener("load", () => {
    requestIframeData("left");
  });
  rightPaneIframe?.addEventListener("load", () => {
    requestIframeData("right");
  });

  // Listen for messages from the iframes
  window.addEventListener("message", (event) => {
    const isLeftPaneUrl =
      leftPaneIframe?.src &&
      getUrlBase(leftPaneIframe.src).startsWith(getUrlBase(event.origin));
    const isRightPaneUrl =
      rightPaneIframe?.src &&
      getUrlBase(rightPaneIframe.src).startsWith(getUrlBase(event.origin));

    // Verify the message is from one of our iframes
    if (isLeftPaneUrl || isRightPaneUrl) {
      if (event.data && event.data.type === "iframe-data") {
        const rgbVal = getRgbValuesFromBackgroundColor(
          event.data.backgroundColor
        );

        if (isLeftPaneUrl) {
          updateTabs(event.data.url, g_rightUrl);

          // Handling colors
          changeCssVariableValue("--left-pane-background-color", rgbVal);
          changeCssVariableValue(
            "--left-pane-text-color",
            invertRgbValues(rgbVal)
          );

          // Handling icon
          if (event.data.icon) {
            leftPaneIcon = event.data.icon;
            createCompositeFavicon(leftPaneIcon, rightPaneIcon);
          }
        }

        if (isRightPaneUrl) {
          // Handing url
          updateTabs(g_leftUrl, event.data.url);

          // Handling colors
          changeCssVariableValue("--right-pane-background-color", rgbVal);
          changeCssVariableValue(
            "--right-pane-text-color",
            invertRgbValues(rgbVal)
          );

          // Handling icon
          if (event.data.icon) {
            rightPaneIcon = event.data.icon;
            createCompositeFavicon(leftPaneIcon, rightPaneIcon);
          }
        }
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
