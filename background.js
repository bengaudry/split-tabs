// Remove X-Frame-Options and modify Content-Security-Policy headers
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

// Handle the browser action click
browser.browserAction.onClicked.addListener(async () => {
  console.log("clicked");

  // Get the current tab's URL
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const currentUrl = activeTabs[0].url;

  // Create a new tab with our split view
  const tab = await browser.tabs.create({
    url: browser.runtime.getURL("split-view.html"),
  });

  // Get the current theme
  const theme = await browser.theme.getCurrent();
  const backgroundColor = theme.colors.frame;
  const textColor = theme.colors.tab_text;

  console.log(theme);

  // wait for the tab to load
  // await new Promise((resolve) => setTimeout(resolve, 500));

  // Wait for the tab to be fully loaded
  browser.tabs.onUpdated.addListener(function listener(
    tabId,
    changeInfo,
    updatedTab
  ) {
    if (tabId === tab.id && changeInfo.status === "complete") {
      // Remove the listener to avoid multiple calls
      browser.tabs.onUpdated.removeListener(listener);

      // Send the LOAD_URLS message to the split-view page
      browser.tabs.sendMessage(tab.id, {
        type: "LOAD_URLS",
        leftUrl: currentUrl,
        rightUrl: currentUrl,
      });

      browser.tabs.sendMessage(tab.id, {
        type: "BROWSER_COLORS",
        backgroundColor: backgroundColor,
        textColor: textColor,
      });
    }
  });
});
