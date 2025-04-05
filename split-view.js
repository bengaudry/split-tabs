document.addEventListener("DOMContentLoaded", () => {
  const leftPane = document.getElementById("left-pane");
  const rightPane = document.getElementById("right-pane");

  const leftPaneUriInput = document.getElementById("left-pane-uri-input");
  const rightPaneUriInput = document.getElementById("right-pane-uri-input");

  // Function to load a URL in an iframe
  function loadUrl(iframe, uriinput, url) {
    if (url === null) return;
    if (!url.startsWith("http$://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    iframe.src = url;
    uriinput.value = url;
  }

  // Listen for messages from the background script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("received");

    if (message.type === "LOAD_URLS") {
      loadUrl(leftPane, leftPaneUriInput, message.leftUrl);
      loadUrl(rightPane, rightPaneUriInput, message.rightUrl);
    }

    // Set the background color if provided
    if (message.type === "BROWSER_COLORS") {
      const root = document.querySelector(":root");
      root.style.setProperty(
        "--main-background-color",
        message.backgroundColor
      );
      root.style.setProperty("--primary-text-color", message.textColor);
    }
  });
});
