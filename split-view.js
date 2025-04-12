// CONSTANTS
const MIN_VIEW_PERCENTAGE = 30;

/** Converts a hexadecimal color code to a rgb string */
const hexToRgb = (hex) => {
  if (!hex) return "";
  if (hex === "white") return "255, 255, 255";
  if (hex === "black") return "0, 0, 0";

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // return {r, g, b}
  return `${r}, ${g}, ${b}`;
};

function invertRgbValues(rgb) {
  // turns "255, 255, 255" into "0, 0, 0"
  const tab = rgb.replaceAll(" ", "").split(",");
  const r = tab[0];
  const g = tab[1];
  const b = tab[2];
  return `${255 - r}, ${255 - g}, ${255 - b}`;
}

function getRgbValuesFromBackgroundColor(bg) {
  console.log(bg, typeof bg);
  if (bg.startsWith("rgb")) {
    return bg.replaceAll("rgb", "").replaceAll("(", "").replaceAll(")", ""); // rgb(a, b, c) => a, b, c
  }
  if (bg.startsWith("rgba")) {
    return bg.replaceAll("rgba", "").replaceAll("(", "").replaceAll(")", ""); // rgba(a, b, c) => a, b, c
  }
  return hexToRgb(bg);
}

/** Changes the value of a css variable */
function changeCssVariableValue(variableName, value) {
  const root = document.querySelector(":root");
  root.style.setProperty(variableName, value);
}

function filterIncorrectUris(uris) {
  return uris.filter(
    (tab) =>
      !tab.url.startsWith("moz-extension://") && !tab.url.startsWith("about:")
  );
}

function getUrlBase(url) {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("file://", "")
    .replace("www.", "");
}

let leftUrl = "";
let rightUrl = "";

const leftPaneHistory = [];
const rightPaneHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  const leftPaneIframe = document.getElementById("left-pane-iframe");
  const rightPaneIframe = document.getElementById("right-pane-iframe");

  const leftPaneUriInput = document.getElementById("left-pane-uri-input");
  const rightPaneUriInput = document.getElementById("right-pane-uri-input");

  const leftPreviousPageBtn = document.getElementById("left-previous-page-btn");
  const leftNextPageBtn = document.getElementById("left-previous-page-btn");

  const leftPaneShortenedUriBtn = document.getElementById(
    "left-pane-shortened-uri-btn"
  );
  const rightPaneShortenedUriBtn = document.getElementById(
    "right-pane-shortened-uri-btn"
  );

  // Function to load a URL in an iframe
  function loadUrl(side, url) {
    if (url === null) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    const urlObj = new URL(url);
    if (side === "left") {
      // avoid refreshing when url is same
      if (leftUrl === url) return;
      leftPaneIframe.src = url;
      leftPaneUriInput.value = url;
      leftPaneShortenedUriBtn.textContent = getUrlBase(urlObj.origin);
      leftPaneHistory.push(url);
      leftUrl = url;
    }
    if (side === "right") {
      // avoid refreshing when url is same
      if (rightUrl === url) return;
      rightPaneIframe.src = url;
      rightPaneUriInput.value = url;
      rightPaneShortenedUriBtn.textContent = getUrlBase(urlObj.origin);
      rightPaneHistory.push(url);
      rightUrl = url;
    }
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
        hexToRgb(message.backgroundColor)
      );
      changeCssVariableValue(
        "--primary-text-color",
        hexToRgb(message.textColor)
      );
      changeCssVariableValue(
        "--secondary-text-color",
        hexToRgb(message.secondaryTextColor)
      );
      changeCssVariableValue("--border-color", hexToRgb(message.inputBorder));
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

  /** Changes the website in a given pane */
  function changePaneUri(side, newUri) {
    try {
      // Add https:// if the URL doesn't start with a protocol
      if (
        !newUri.startsWith("http://") &&
        !newUri.startsWith("https://") &&
        !newUri.startsWith("file://")
      ) {
        newUri = "https://" + newUri;
      }
      const uri = new URL(newUri);
      loadUrl(side, uri.toString());
    } catch (err) {
      // incorrect uri
      console.error("INCORRECT URI", err);
    }
  }

  /* ====== EVENT HANDLING ====== */

  // Change panes uris on input blurs
  leftPaneUriInput.addEventListener("blur", (e) => {
    changePaneUri("left", e.target.value);
  });
  rightPaneUriInput.addEventListener("blur", (e) => {
    changePaneUri("right", e.target.value);
  });

  // On open toolbars
  const populateToolbarLinkContainer = (side) => {
    browser.runtime
      .sendMessage({ type: "FETCH_TABS" })
      .then((response) => {
        if (response.type === "TABS_DATA") {
          const toolbarLinksContainer = document
            .getElementById(`${side}-pane-toolbar`)
            .querySelector(".toolbar-links-container");
          toolbarLinksContainer.innerHTML = ""; // Clear existing links

          const tabs = filterIncorrectUris(response.tabs).sort(
            (a, b) => a.lastAccessed - b.lastAccessed
          );

          for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            const el = `<button id="toolbar-link-${i}" class="toolbar-tab-link">
                          <img src="${tab.favIconUrl}" alt="" />
                          <span>${tab.title}</span>
                        </button>`;

            toolbarLinksContainer.innerHTML += el;
            const link = document.getElementById(`toolbar-link-${i}`);
            link.addEventListener("click", (e) => {
              loadUrl(side, tab.url);
            });
          }
        }
      })
      .catch(console.error);
    togglePaneToolbar(side);
  };

  leftPaneShortenedUriBtn.addEventListener("click", () =>
    populateToolbarLinkContainer("left")
  );
  rightPaneShortenedUriBtn.addEventListener("click", () =>
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

  // Close pane(s) when pressing Esc
  document.addEventListener("keyup", (e) => {
    if (e.code === "Escape") {
      closePaneToolbar("left");
      closePaneToolbar("right");
    }
  });

  // Handling resizing
  let isUserResizingViews = false;
  const resizeDraggable = document.getElementById("resize-draggable");

  resizeDraggable.addEventListener("mousedown", (e) => {
    isUserResizingViews = true;
  });
  resizeDraggable.addEventListener("mouseup", (e) => {
    isUserResizingViews = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (isUserResizingViews && e.buttons == 1) {
      const leftPercent = Math.round((e.pageX * 100) / window.innerWidth);
      const rightPercent = 100 - leftPercent;
      if (
        leftPercent >= MIN_VIEW_PERCENTAGE &&
        rightPercent >= MIN_VIEW_PERCENTAGE
      ) {
        changeCssVariableValue("--left-pane-view-percentage", leftPercent);
        changeCssVariableValue("--right-pane-view-percentage", rightPercent);
      }
    }
  });

  leftPaneIframe.addEventListener("load", (e) => {
    try {
      // Send a message to the iframe to request its URL
      e.target.contentWindow.postMessage({ type: "getUrl" }, "*");
    } catch (error) {
      console.error("Could not access iframe content:", error);
    }
  });

  rightPaneIframe.addEventListener("load", (e) => {
    try {
      // Send a message to the iframe to request its URL
      e.target.contentWindow.postMessage({ type: "getUrl" }, "*");
    } catch (error) {
      console.error("Could not access iframe content:", error);
    }
  });

  // Listen for messages from the iframes
  window.addEventListener("message", (event) => {
    console.log(event);
    console.log(rightPaneIframe.src, event.origin);
    const isLeftPaneUri = getUrlBase(leftPaneIframe.src).startsWith(
      getUrlBase(event.origin)
    );
    const isRightPaneUri = getUrlBase(rightPaneIframe.src).startsWith(
      getUrlBase(event.origin)
    );
    // Verify the message is from one of our iframes
    if (isLeftPaneUri || isRightPaneUri) {
      if (event.data && event.data.type === "url") {
        const rgbVal = getRgbValuesFromBackgroundColor(
          event.data.backgroundColor
        );

        if (isLeftPaneUri) {
          changeCssVariableValue("--left-pane-background-color", rgbVal);
          changeCssVariableValue("--left-pane-text-color", invertRgbValues(rgbVal));
        }
        if (isRightPaneUri) {
          changeCssVariableValue("--right-pane-background-color", rgbVal);
          changeCssVariableValue("--right-pane-text-color", invertRgbValues(rgbVal));
        }
      }
    }
  });

  // Add click event listeners to iframes
  function setupIframeNavigation(iframe, side) {
    iframe.addEventListener("load", () => {
      try {
        // Get the iframe's window
        const iframeWindow = iframe.contentWindow;

        // Add message event listener to handle navigation
        window.addEventListener("message", (e) => {
          // Check if the message is from our iframe
          if (
            e.source === iframeWindow &&
            e.data &&
            e.data.type === "navigation"
          ) {
            loadUrl(side, e.data.url);
          }
        });

        // Inject navigation handler into the iframe
        iframeWindow.postMessage(
          {
            type: "setupNavigation",
            side: side,
          },
          "*"
        );
      } catch (error) {
        console.log("Could not access iframe content:", error);
      }
    });
  }

  // Setup navigation for both iframes
  // setupIframeNavigation(leftPaneIframe, "left");
  // setupIframeNavigation(rightPaneIframe, "right");
});
