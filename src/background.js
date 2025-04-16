// Remove X-Frame-Options and modify Content-Security-Policy headers
// because some pages prevent being renderered into iframes
browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    let responseHeaders = details.responseHeaders;

    // Remove X-Frame-Options header
    responseHeaders = responseHeaders.filter(
      (header) => header.name.toLowerCase() !== "x-frame-options"
    );

    // Modify Content-Security-Policy to allow framing
    responseHeaders = responseHeaders.filter(
      (header) => header.name.toLowerCase() !== "content-security-policy"
    );

    return { responseHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_TABS") {
    // Query all tabs in the current window
    browser.tabs
      .query({ currentWindow: true })
      .then((tabs) => {
        console.log("Current tabs:", tabs);
        // Send the tabs data back to the specific tab that requested it
        sendResponse({
          type: "TABS_DATA",
          tabs: tabs,
        });
      })
      .catch((error) => {
        console.error("Error fetching tabs:", error);
        browser.tabs.sendMessage(sender.tab.id, {
          type: "TABS_DATA",
          error: error.message,
        });
      });
    return true; // Indicate we will send response asynchronously
  }
});

let tab = null;

// Handle the browser action click
browser.pageAction.onClicked.addListener(async () => {
  console.log("clicked");

  // Get the current tab's URL
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const currentUrl = activeTabs[0].url;

  // Create a new tab with our split view
  tab = await browser.tabs.create({
    url: browser.runtime.getURL("split-view.html"),
    discarded: false
  });

  // Get the current theme
  const theme = await browser.theme.getCurrent();
  const backgroundColor = theme.colors.frame;
  const textColor = theme.colors.tab_text;
  const inputBorder = theme.colors.toolbar_field_border;
  const secondaryTextColor = theme.colors.toolbar_field_highlight;

  // Wait for the tab to be fully loaded
  browser.tabs.onUpdated.addListener(function listener (tabId, changeInfo, updatedTab) {
    if (tabId === tab.id && changeInfo.status === "complete") {
      // Remove the listener to avoid multiple calls
      browser.tabs.onUpdated.removeListener(listener);

      tab.faviconUrl = activeTabs[0]?.faviconUrl;

      // Send the LOAD_URLS message to the split-view page
      browser.tabs.sendMessage(tab.id, {
        type: "LOAD_URLS",
        leftUrl: currentUrl,
        rightUrl: "https://google.com",
      });

      browser.tabs.sendMessage(tab.id, {
        type: "BROWSER_COLORS",
        backgroundColor,
        textColor,
        inputBorder,
        secondaryTextColor
      });
    }
  });
});
