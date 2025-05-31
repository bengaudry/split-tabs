import {
  changeCssVariableValue,
  getRgbValuesFromBackgroundColor,
  invertRgbValues,
} from "./lib/colors";
import { getUrlBase, filterIncorrectUrls, addProtocolToUrl } from "./lib/urls";
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

function changeOrientation(newOrientation) {
  if (newOrientation === undefined) { // toggle orientation
    if (orientation === "horizontal") orientation = "vertical";
    else orientation = "horizontal";
  } else { // set orientation with defined value
    orientation = newOrientation;
  }
  changeCssVariableValue("--view-orientation", orientation === "vertical" ? "column" : "row")
  document.body?.classList.toggle("horizontal", orientation === "horizontal");
  document.body?.classList.toggle("vertical", orientation === "vertical");
}

// Wait for the split view tab to be fully loaded to avoid issues
// accessing elements and events
document.addEventListener("DOMContentLoaded", () => {
  // iframe refs
  const leftPaneIframe = document.getElementById("left-pane-iframe");
  const rightPaneIframe = document.getElementById("right-pane-iframe");

  // url input refs
  const leftPaneUrlInput = document.getElementById("left-pane-url-input");
  const rightPaneUrlInput = document.getElementById("right-pane-url-input");

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

  function updateTabs(updatedLeftUrl, updatedRightUrl) {
    browser.runtime.sendMessage({
      type: "UPDATE_TABS",
      updatedLeftUrl,
      updatedRightUrl,
    });

    if (updatedLeftUrl) {
      const updatedLeftUrlObj = new URL(updatedLeftUrl);
      leftPaneUrlInput.value = updatedLeftUrl;
      leftPaneShortenedUrlBtn.textContent = getUrlBase(
        updatedLeftUrlObj.origin
      );
    }

    if (updatedRightUrl) {
      const updatedRightUrlObj = new URL(updatedRightUrl);
      rightPaneUrlInput.value = updatedRightUrl;
      rightPaneShortenedUrlBtn.textContent = getUrlBase(
        updatedRightUrlObj.origin
      );
    }
  }

  /** Function to load a URL in an iframe */
  function loadUrl(side, url, isRefreshing) {
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
  }

  // Listen for messages from the background script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Initial url load
    if (message.type === "LOAD_URLS") {
      loadUrl("left", message.leftUrl);
      loadUrl("right", message.rightUrl);
    }

    // Set the background color if provided
    if (message.type === "BROWSER_COLORS") {
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
    
    if (message.type === "SET_ORIENTATION") {
      changeOrientation(message.orientation);
    }
  });


  /* ===== PANES STATE HANDLING ===== */
  function closePaneToolbar(side) {
    const relativeToolbar = document.getElementById(`${side}-pane-toolbar`);
    relativeToolbar.setAttribute("data-expanded", "false");
  }

  function togglePaneToolbar(side) {
    const relativeToolbar = document.getElementById(`${side}-pane-toolbar`);
    const isToolbarExpanded =
      relativeToolbar.getAttribute("data-expanded") === "true";
    relativeToolbar.setAttribute(
      "data-expanded",
      isToolbarExpanded ? "false" : "true"
    );
  }

  /** Make a query with the search engine or open a url in the split-view
   *  when the search bar receives validation (Enter key or blur) */
  function handleSearchBarEndInput(side, query) {
    if (
      query.startsWith("http://") ||
      query.startsWith("https://") ||
      query.startsWith("file://")
    ) {
      loadUrl(side, query);
    } else {
      const googleUrl = new URL("https://www.google.com/search");
      googleUrl.searchParams.set("q", query);
      loadUrl(side, googleUrl.toString());
    }

    closePaneToolbar(side);
  }

  /* ====== EVENT HANDLING ====== */

  // Change panes urls on input blurs or Enter key press
  leftPaneUrlInput.addEventListener("blur", (e) => {
    handleSearchBarEndInput("left", e.target.value);
  });
  rightPaneUrlInput.addEventListener("blur", (e) => {
    handleSearchBarEndInput("right", e.target.value);
  });

  leftPaneUrlInput.addEventListener("keyup", (e) => {
    if (e.code === "Enter") handleSearchBarEndInput("left", e.target.value);
  });
  rightPaneUrlInput.addEventListener("keyup", (e) => {
    if (e.code === "Enter") handleSearchBarEndInput("right", e.target.value);
  });

  /** Fetches browser opened tabs and creates links to them
   *  inside the toolbar */
  const populateToolbarLinkContainer = (side) => {
    browser.runtime
      .sendMessage({ type: "FETCH_TABS" })
      .then((response) => {
        if (response.type === "TABS_DATA") {
          const toolbarLinksContainer = document
            .getElementById(`${side}-pane-toolbar`)
            .querySelector(".toolbar-links-container");
          toolbarLinksContainer.innerHTML = ""; // Clear existing links

          const tabs = filterIncorrectUrls(response.tabs).sort(
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

            button.addEventListener("click", (e) => {
              loadUrl(side, tab.url);
            });
            toolbarLinksContainer.appendChild(button);
          }
        }
      })
      .catch(console.error);
    togglePaneToolbar(side);
  };

  leftPaneRefreshBtn.addEventListener("click", () => {
    loadUrl("left", g_leftUrl, true);
  });
  rightPaneRefreshBtn.addEventListener("click", () => {
    loadUrl("right", g_rightUrl, true);
  });

  // Add links to toolbar when toggle is pressed
  leftPaneShortenedUrlBtn.addEventListener("click", () =>
    populateToolbarLinkContainer("left")
  );
  rightPaneShortenedUrlBtn.addEventListener("click", () =>
    populateToolbarLinkContainer("right")
  );

  // Close toolbars when clicking on background
  Array.from(document.getElementsByClassName("toolbar-expandable")).forEach(
    (el) => {
      // Add click listener to prevent closing when clicking on inputs
      const inputs = el.querySelectorAll("input");
      inputs.forEach((input) => {
        input.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      });

      el.addEventListener("click", (e) => {
        // Only close the toolbar that contains the clicked element
        const toolbar = e.target.closest(".toolbar");
        if (toolbar) {
          toolbar.setAttribute("data-expanded", "false");
        }
      });
    }
  );

  // Close panes when pressing Esc
  document.addEventListener("keyup", (e) => {
    if (e.code === "Escape") {
      closePaneToolbar("left");
      closePaneToolbar("right");
    }
  });

  // Handling closing split view
  leftPaneCloseBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "CLOSE_SPLIT", keep: "right" });
  });
  rightPaneCloseBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ type: "CLOSE_SPLIT", keep: "left" });
  });

  // Handling resizing
  let isUserResizingViews = false;
  const resizeDraggable = document.getElementById("resize-draggable");

  resizeDraggable.addEventListener("mousedown", () => {
    console.info("split-view.js > mousedown");
    isUserResizingViews = true;
  });
  resizeDraggable.addEventListener("mouseup", () => {
    console.info("split-view.js > mouseup");
    isUserResizingViews = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (isUserResizingViews && e.buttons == 1) {
      // check if the user is pressing the mouse btn
      const leftPercent = Math.round(orientation === "horizontal" ? (e.pageX * 100) / window.innerWidth : (e.pageY * 100) / window.innerHeight);
      const rightPercent = 100 - leftPercent;
      if (
        leftPercent >= MIN_VIEW_PERCENTAGE &&
        rightPercent >= MIN_VIEW_PERCENTAGE
      ) {
        changeCssVariableValue("--left-pane-view-percentage", `${leftPercent}%`);
        changeCssVariableValue("--right-pane-view-percentage", `${rightPercent}%`);
      }
    }
  });

  const askUrls = () => {
    try {
      // Send a message to the iframe to request its URL
      window.parent.postMessage({ type: "getUrl" }, "*");
    } catch (error) {
      console.error("Could not access iframe content:", error);
    }
  };

  leftPaneIframe.addEventListener("load", askUrls);
  rightPaneIframe.addEventListener("load", askUrls);

  // Listen for messages from the iframes
  window.addEventListener("message", (event) => {
    const isLeftPaneUrl = getUrlBase(leftPaneIframe.src).startsWith(
      getUrlBase(event.origin)
    );
    const isRightPaneUrl = getUrlBase(rightPaneIframe.src).startsWith(
      getUrlBase(event.origin)
    );

    // Verify the message is from one of our iframes
    if (isLeftPaneUrl || isRightPaneUrl) {
      if (event.data && event.data.type === "url") {
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
