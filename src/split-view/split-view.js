import {
  changeCssVariableValue,
  getRgbValuesFromBackgroundColor,
  invertRgbValues,
} from "./lib/colors";
import {
  getUrlBase,
  filterIncorrectTabs,
  addProtocolToUrl,
  isUrlLike,
} from "./lib/urls";
import { createCompositeFavicon } from "./lib/favicon";

// ===== CONSTANTS ===== //
const MIN_VIEW_PERCENTAGE = 30;

// ===== GLOBAL VARIABLES ===== //
let orientation = "horizontal";

let g_leftUrl = "";
let g_rightUrl = "";

const leftPaneHistory = [];
const rightPaneHistory = [];

let leftPaneIcon = null;
let rightPaneIcon = null;

let activeSide = "left";

/**
 * Changes the orientation to `newOrientation` if provided, or toggles the
 * orientation if `newOrientation` param is undefined
 * @param {"horizontal" | "vertical" | undefined} newOrientation
 * @returns {"horizontal" | "vertical"} the new orientation
 */
function changeOrientation(newOrientation) {
  if (newOrientation === undefined) {
    // toggle orientation
    if ("horizontal" === orientation) orientation = "vertical";
    else orientation = "horizontal";
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
  const leftPaneIframe = document.getElementById("left-pane-iframe");
  const rightPaneIframe = document.getElementById("right-pane-iframe");

  // toolbar toggles refs
  const leftPaneShortenedUrlBtn = document.getElementById(
    "left-pane-shortened-url-btn"
  );
  const rightPaneShortenedUrlBtn = document.getElementById(
    "right-pane-shortened-url-btn"
  );

  // refresh buttons refs
  const leftPaneRefreshBtn = document.getElementById("left-pane-refresh-btn");
  const rightPaneRefreshBtn = document.getElementById("right-pane-refresh-btn");

  // close buttons refs
  const leftPaneCloseBtn = document.getElementById("left-pane-close-split-btn");
  const rightPaneCloseBtn = document.getElementById(
    "right-pane-close-split-btn"
  );

  const searchbarWrapper = document.getElementById("searchbar-wrapper");
  const searchbarInput = document.getElementById("searchbar-url-input");

  /** Sends a message to the iframe to get the url, the icon and the colors of the tab */
  const requestIframeData = (side) => {
    console.info("split-view.js > Requesting iframe data for side", side);
    if (side === "left") {
      if (!leftPaneIframe?.src) return;
      leftPaneIframe?.contentWindow?.postMessage(
        { type: "IFRAME_DATA" },
        leftPaneIframe.src
      );
    } else if (side === "right") {
      if (!rightPaneIframe?.src) return;
      rightPaneIframe?.contentWindow?.postMessage(
        { type: "IFRAME_DATA" },
        rightPaneIframe.src
      );
    }
  };

  /**
   * Update both tabs if the url is not undefined
   * @param {string | undefined} updatedLeftUrl
   * @param {string | undefined} updatedRightUrl
   */
  function updateTabs(updatedLeftUrl, updatedRightUrl) {
    g_leftUrl = updatedLeftUrl || g_leftUrl;
    g_rightUrl = updatedRightUrl || g_rightUrl;

    browser.runtime.sendMessage({
      type: "UPDATE_TABS",
      updatedLeftUrl: g_leftUrl,
      updatedRightUrl: g_rightUrl,
    });

    if (updatedLeftUrl) {
      const updatedLeftUrlObj = new URL(updatedLeftUrl);
      leftPaneShortenedUrlBtn.textContent = updatedLeftUrlObj.hostname;
    }

    if (updatedRightUrl) {
      const updatedRightUrlObj = new URL(updatedRightUrl);
      rightPaneShortenedUrlBtn.textContent = updatedRightUrlObj.hostname;
    }
  }

  /**
   * Function to load a URL in an iframe
   * @param {"left" | "right"} side
   * @param {string} url
   * @param {boolean} isRefreshing
   */
  function loadUrl(side, url, isRefreshing) {
    console.info("split-view.js > Loading url", url, "in side", side);
    if (url === null) return;
    url = addProtocolToUrl(url);

    if ("left" === side) {
      // avoid refreshing when url is same
      if (g_leftUrl === url && !isRefreshing) return;
      leftPaneIframe.src = url;
      leftPaneHistory.push(url);
      g_leftUrl = url;
    }

    if ("right" === side) {
      // avoid refreshing when url is same
      if (g_rightUrl === url && !isRefreshing) return;
      rightPaneIframe.src = url;
      rightPaneHistory.push(url);
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
    // Initial url load
    if ("LOAD_URLS" === message.type) {
      if (message.leftUrl !== null) {
        console.info("Loading left url");
        loadUrl("left", message.leftUrl);
      } else {
        activeSide = "left";
        populateToolbarLinkContainer();
        openSearchbar();
      }

      if (message.rightUrl !== null) {
        console.info("Loading right url");
        loadUrl("right", message.rightUrl);
      } else {
        activeSide = "right";
        populateToolbarLinkContainer();
        openSearchbar();
      }
    }

    // Move left tab to the right and right tab to the left
    if ("REVERSE_TABS" === message.type) {
      reverseTabs();
    }

    // Set the background color if provided
    if ("BROWSER_COLORS" === message.type) {
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
    }

    // Change the orientation when context menu pressed
    if ("SET_ORIENTATION" === message.type) {
      changeOrientation(message.orientation);
    }
  });

  /* ===== SEARCHBAR VISIBILITY HANDLING ===== */
  /**
   * Open the searchbar and set the default URL if provided
   * @param {string | undefined} defaultUrl
   */
  function openSearchbar(defaultUrl) {
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
   * @param {"left" | "right"} side
   * @param {string} query
   */
  function handleSearchBarEndInput(side, query) {
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

      const toolbarLinksContainer = document
        .getElementById("searchbar-wrapper")
        .querySelector(".toolbar-links-container");
      toolbarLinksContainer.innerHTML = ""; // Clear existing links

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
        toolbarLinksContainer.appendChild(button);
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
  searchbarInput?.addEventListener("blur", (e) => {
    handleSearchBarEndInput(activeSide, e.target.value);
  });
  searchbarInput?.addEventListener("keyup", (e) => {
    if (e.code === "Enter") handleSearchBarEndInput(activeSide, e.target.value);
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
  leftPaneRefreshBtn.addEventListener("click", () => {
    loadUrl("left", g_leftUrl, true);
  });
  rightPaneRefreshBtn.addEventListener("click", () => {
    loadUrl("right", g_rightUrl, true);
  });

  // == CLOSE SPLIT == //
  // Handling closing split view
  leftPaneCloseBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "CLOSE_SPLIT", keep: "right" });
  });
  rightPaneCloseBtn.addEventListener("click", () => {
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
    const isLeftPaneUrl = getUrlBase(leftPaneIframe?.src).startsWith(
      getUrlBase(event.origin)
    );
    const isRightPaneUrl = getUrlBase(rightPaneIframe?.src).startsWith(
      getUrlBase(event.origin)
    );

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
});
