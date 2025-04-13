// CONSTANTS
const MIN_VIEW_PERCENTAGE = 30;

/** Converts a hexadecimal color code to a rgb string */
const hexToRgb = (hex) => {
  if (!hex) return "";
  if (hex === "white") return "255, 255, 255";
  if (hex === "black") return "0, 0, 0";
  if (hex === "transparent") return "0, 0, 0, 0";

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // return {r, g, b}
  return `${r}, ${g}, ${b}, 1`;
};

function invertRgbValues(rgb) {
  // turns "255, 255, 255" into "0, 0, 0"
  const tab = rgb.replaceAll(" ", "").split(",");
  const r = tab[0];
  const g = tab[1];
  const b = tab[2];
  const a = tab[3] || 1;
  return `${255 - r}, ${255 - g}, ${255 - b}, ${a}`;
}

function getRgbValuesFromBackgroundColor(bg) {
  if (bg === null || bg === undefined) return `0, 0, 0, 0`;
  bg = bg.replaceAll(" ", "");
  if (bg.startsWith("rgba")) {
    return bg.replaceAll("rgba", "").replaceAll("(", "").replaceAll(")", ""); // rgba(a, b, c, d) => a, b, c, d
  } else if (bg.startsWith("rgb")) {
    return `${bg
      .replaceAll("rgb", "")
      .replaceAll("(", "")
      .replaceAll(")", "")},1`; // rgb(a, b, c) => a, b, c, 1
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

let leftPaneIcon = null;
let rightPaneIcon = null;

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
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("file://")) {
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
      //changeCssVariableValue("--border-color", hexToRgb(message.inputBorder));
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

  /* ====== EVENT HANDLING ====== */

  // Change panes uris on input blurs
  leftPaneUriInput.addEventListener("blur", (e) => {
    loadUrl("left", e.target.value);
  });
  rightPaneUriInput.addEventListener("blur", (e) => {
    loadUrl("right", e.target.value);
  });
  leftPaneUriInput.addEventListener("keyup", (e) => {
    if (e.code === "Enter") {
      loadUrl("left", e.target.value);
      closePaneToolbar("left");
    }
  });
  rightPaneUriInput.addEventListener("keyup", (e) => {
    if (e.code === "Enter") {
      loadUrl("right", e.target.value);
      closePaneToolbar("right");
    }
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

  // Function to create composite favicon
  function createCompositeFavicon() {
    console.info("Left :", leftPaneIcon);
    console.info("Right :", rightPaneIcon);
    if (!leftPaneIcon || !rightPaneIcon) return;

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    // Load both images
    const leftImg = new Image();
    const rightImg = new Image();

    leftImg.crossOrigin = "anonymous";
    rightImg.crossOrigin = "anonymous";

    leftImg.onload = () => {
      rightImg.onload = () => {
        // Draw left icon in top left (16x16)
        ctx.drawImage(leftImg, 0, 0, 20, 20);

        // Draw right icon in bottom right (16x16)
        ctx.drawImage(rightImg, 12, 12, 20, 20);

        // Convert canvas to favicon
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = canvas.toDataURL("image/png");
        document.head.appendChild(link);

        console.log(link);
      };
    };

    rightImg.src = rightPaneIcon;
    leftImg.src = leftPaneIcon;
  }

  // Listen for messages from the iframes
  window.addEventListener("message", (event) => {
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
          changeCssVariableValue(
            "--left-pane-text-color",
            invertRgbValues(rgbVal)
          );
          if (event.data.icon) {
            leftPaneIcon = event.data.icon;
            createCompositeFavicon();
          }
        }
        if (isRightPaneUri) {
          console.info("here");
          changeCssVariableValue("--right-pane-background-color", rgbVal);
          changeCssVariableValue(
            "--right-pane-text-color",
            invertRgbValues(rgbVal)
          );
          if (event.data.icon) {
            rightPaneIcon = event.data.icon;
            createCompositeFavicon();
          }
        }
      }
    }
  });
});
