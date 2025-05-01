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

let leftUrl = "https://google.com";
let rightUrl = "https://google.com";

let tab = null;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_TABS") {
    // Query all tabs in the current window
    browser.tabs
      .query({ currentWindow: true })
      .then((tabs) => {
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

  if (message.type === "UPDATE_TABS") {
    if (message.leftUrl) leftUrl = message.leftUrl;
    if (message.rightUrl) rightUrl = message.rightUrl;
  }

  if (message.type === "CLOSE_SPLIT") {
    browser.tabs.create({
      url: message.keep === "left" ? leftUrl : rightUrl,
      active: true,
    })
    browser.tabs.remove(tab.id);
    tab = null;
  }
});


// Handle the browser action click
browser.pageAction.onClicked.addListener(async () => {
  // Get the current tab's URL
  const activeTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  const currentUrl = activeTabs[0].url;

  // Creates a new tab containing the split view
  tab = await browser.tabs.create({
    url: browser.runtime.getURL("split-view.html"),
    discarded: false,
  });

  // Get the current theme
  const theme = await browser.theme.getCurrent();
  const backgroundColor = theme.colors.frame;
  const textColor = theme.colors.tab_text ?? theme.colors.toolbar_text;
  const inputBorder = theme.colors.toolbar_field_border;
  const secondaryTextColor = theme.colors.toolbar_field_highlight;

  // Wait for the tab to be fully loaded, and send informations
  browser.tabs.onUpdated.addListener(function listener(
    tabId,
    changeInfo,
    updatedTab
  ) {
    if (tabId === tab.id && changeInfo.status === "complete") {
      // Remove the listener to avoid multiple calls
      browser.tabs.onUpdated.removeListener(listener);

      leftUrl = currentUrl;
      rightUrl = "https://google.com";

      // Send the LOAD_URLS event to the split-view page
      browser.tabs.sendMessage(tab.id, {
        type: "LOAD_URLS",
        leftUrl,
        rightUrl,
      });

      // Send the BROWSER_COLORS data to the split-view page
      browser.tabs.sendMessage(tab.id, {
        type: "BROWSER_COLORS",
        backgroundColor,
        textColor,
        inputBorder,
        secondaryTextColor,
      });
    }
  });
});

browser.tabs.onUpdated.addListener(
  async (updatedTabId, changeInfo, newTabState) => {
    if (updatedTabId !== tab?.id) return;

    if (changeInfo.status === "loading") {
      // Get the current theme
      const theme = await browser.theme.getCurrent();
      const backgroundColor = theme.colors.frame;
      const textColor = theme.colors.tab_text ?? theme.colors.toolbar_text;
      const inputBorder = theme.colors.toolbar_field_border;
      const secondaryTextColor = theme.colors.toolbar_field_highlight;

      // Wait for the tab to be fully loaded, and send informations
      browser.tabs.onUpdated.addListener(function listener(
        tabId,
        changeInfo,
        updatedTab
      ) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          // Remove the listener to avoid multiple calls
          browser.tabs.onUpdated.removeListener(listener);

          // Send the LOAD_URLS event to the split-view page
          browser.tabs.sendMessage(tab.id, {
            type: "LOAD_URLS",
            leftUrl,
            rightUrl,
          });

          // Send the BROWSER_COLORS data to the split-view page
          browser.tabs.sendMessage(tab.id, {
            type: "BROWSER_COLORS",
            backgroundColor,
            textColor,
            inputBorder,
            secondaryTextColor,
          });
        }
      });
    }
  }
);

/* Create context menu */
browser.contextMenus.create({
  id: "split-tabs-context-menu",
  type: "separator",
  title: "Split tabs",
  contexts: ["all"],
});

browser.contextMenus.create({
  id: "split-tabs-context-submenu-reverse-tabs",
  title: "Reverse tabs",
  contexts: ["all"],
});

browser.contextMenus.onClicked.addListener(function listener(info, activeTab) {
  if (tab?.id === activeTab?.id) {
    browser.tabs.sendMessage(tab.id, {
      type: "LOAD_URLS",
      leftUrl: rightUrl,
      rightUrl: leftUrl,
    });
  }
});
