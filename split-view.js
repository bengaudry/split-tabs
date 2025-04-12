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

let leftUrl = "";
let rightUrl = "";

document.addEventListener("DOMContentLoaded", () => {
  const leftPane = document.getElementById("left-pane-iframe");
  const rightPane = document.getElementById("right-pane-iframe");

  const leftPaneUriInput = document.getElementById("left-pane-uri-input");
  const rightPaneUriInput = document.getElementById("right-pane-uri-input");

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
      leftPane.src = url;
      leftPaneUriInput.value = url;
      leftPaneShortenedUriBtn.textContent = urlObj.origin
        .replace("https://", "")
        .replace("http://", "")
        .replace("file://", "")
        .replace("www.", "");
      leftUrl = url;
    }
    if (side === "right") {
      // avoid refreshing when url is same
      if (rightUrl === url) return;
      rightPane.src = url;
      rightPaneUriInput.value = url;
      rightPaneShortenedUriBtn.textContent = urlObj.origin
        .replace("https://", "")
        .replace("http://", "")
        .replace("file://", "")
        .replace("www.", "");
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
      console.log(message.inputBorder, hexToRgb(message.inputBorder));
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
            const el = `<li class="toolbar-tab-link" data-url="${tab.url}">
                      <a target="_self" id="toolbar-link-${i}" href="${tab.url}">
                        <img src="${tab.favIconUrl}" alt="" />
                        <span>${tab.title}</span>
                      </a>
                    </li>`;

            toolbarLinksContainer.innerHTML += el;
            document
              .getElementById(`toolbar-link-${i}`)
              .addEventListener("click", (e) => {
                e.preventDefault();
                loadUrl(side, tab.url);
              });
          }
        }
      })
      .catch(console.error);

    // console.log(msg);
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
  document
    .getElementById("resize-draggable")
    .addEventListener("mousedown", (e) => {
      isUserResizingViews = true;
      console.info(e);
    });
  document
    .getElementById("resize-draggable")
    .addEventListener("mouseup", (e) => {
      isUserResizingViews = false;
      console.info(e);
    });

  document.addEventListener("mousemove", (e) => {
    if (isUserResizingViews) {
      console.log(e.pageX / window.innerWidth);
      const leftPercent = Math.round((e.pageX * 100) / window.innerWidth);
      const rightPercent = 100 - leftPercent;
      if (leftPercent >= MIN_VIEW_PERCENTAGE && rightPercent >= MIN_VIEW_PERCENTAGE) {
        changeCssVariableValue("--left-pane-view-percentage", leftPercent);
        changeCssVariableValue("--right-pane-view-percentage", rightPercent);
      }
    }
  });
});
