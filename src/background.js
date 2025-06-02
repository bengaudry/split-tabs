console.info("background.js > Loaded");

const defaultSettings = {
  "close-tab-before-opening": true,
};

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

// ===== GLOBAL VARIABLES ===== //
let leftUrl = null;
let rightUrl = null;

let tab = null;

async function fetchTabs(sender, sendResponse) {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    sendResponse({
      type: "TABS_DATA",
      tabs: tabs,
    });
    return tabs;
  } catch (e) {
    console.error("background.js > Error while fetching tabs");
    console.error(e);
    browser.tabs.sendMessage(sender.tab.id, {
      type: "TABS_DATA",
      error: error.message,
    });
    return null;
  }
}

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // Initialize extension
  switch (message.type) {
    case "INIT_EXT":
      console.info("background.js > Initializing extension");
      console.info(message.side);
      handleInitializeExtension(message.side);
      break;

    // Fetch opened tabs on browser to make suggestions to user
    case "FETCH_TABS":
      console.info("background.js > Fetching current tab");
      // Query all tabs in the current window
      const tabs = await fetchTabs(sender, sendResponse);
      return {
        type: "TABS_DATA",
        tabs: tabs,
      };

    // Update global variables when changing url in split view
    case "UPDATE_TABS":
      if (message.leftUrl) leftUrl = message.leftUrl;
      if (message.rightUrl) rightUrl = message.rightUrl;
      break;

    // Close one of the tabs in the split
    case "CLOSE_SPLIT":
      console.info("background.js > Closing split view");
      browser.tabs.create({
        url: message.keep === "left" ? leftUrl : rightUrl,
        active: true,
      });
      browser.tabs.remove(tab.id);
      tab = null;
      break;

    case "OPEN_SETTINGS":
      await browser.tabs.create({
        url: browser.runtime.getURL("settings.html"),
        discarded: false,
      });
      break;

    case "EDIT_SETTINGS":
      console.info("background.js > Editing setting " + message.key);
      localStorage.setItem(
        "split-tabs-" + message.key + "-setting",
        message.value
      );
      break;

    case "GET_SETTING":
      return {
        type: "SETTING_VALUE",
        key: message.key,
        value: getSettingValue(message.key),
      };

    default:
      break;
  }
});

/**
 * Returns the setting value for a given setting key
 * @param {keyof defaultSettings} key
 * @returns {string | null}
 */
const getSettingValue = (key) => {
  const settingValue = localStorage.getItem("split-tabs-" + key + "-setting");
  return settingValue ?? defaultSettings[key] ?? null;
};

const handleInitializeExtension = async (side) => {
  try {
    // Get the current tab's URL
    const activeTabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = activeTabs[0];
    const currentUrl = activeTab.url;

    // Creates a new tab containing the split view
    tab = await browser.tabs.create({
      url: browser.runtime.getURL("split-view.html"),
      discarded: false,
    });

    if (Boolean(getSettingValue("close-tab-before-opening")) === true) {
      console.log("Active tab", activeTab);
      browser.tabs.remove(activeTab.id);
    }

    // Get the current theme
    const theme = await browser.theme.getCurrent();

    const backgroundColor = theme.colors?.frame;
    const textColor = theme.colors?.tab_text ?? theme.colors?.toolbar_text;
    const inputBorder = theme.colors?.toolbar_field_border;
    const secondaryTextColor = theme.colors?.toolbar_field_highlight;

    // Wait for the tab to be fully loaded, and send informations
    browser.tabs.onUpdated.addListener(function listener(
      tabId,
      changeInfo,
      updatedTab
    ) {
      if (tabId === tab.id && changeInfo.status === "complete") {
        // Remove the listener to avoid multiple calls
        browser.tabs.onUpdated.removeListener(listener);

        leftUrl = side === "left" || side === "top" ? currentUrl : null;
        rightUrl = side === "right" || side === "bottom" ? currentUrl : null;

        console.info("background.js > Sending SET_ORIENTATION");
        browser.tabs.sendMessage(tab.id, {
          type: "SET_ORIENTATION",
          orientation:
            side === "top" || side === "bottom" ? "vertical" : "horizontal",
        });

        console.info("background.js > Sending LOAD_URLS");
        // Send the LOAD_URLS event to the split-view page
        browser.tabs.sendMessage(tab.id, {
          type: "LOAD_URLS",
          leftUrl,
          rightUrl,
        });

        console.info("background.js > Sending BROWSER_COLORS");
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
  } catch (err) {
    console.error("background.js > Error while initializing extension :");
    console.error(err);
  }
};

browser.tabs.onUpdated.addListener(
  async (updatedTabId, changeInfo, newTabState) => {
    if (updatedTabId !== tab?.id) return;

    if (changeInfo.status === "loading") {
      // Wait for the tab to be fully loaded, and send informations
      browser.tabs.onUpdated.addListener(async function listener(
        tabId,
        changeInfo,
        updatedTab
      ) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          // Get the current theme
          const theme = await browser.theme.getCurrent();
          const backgroundColor = theme.colors.frame;
          const textColor = theme.colors.tab_text ?? theme.colors.toolbar_text;
          const inputBorder = theme.colors.toolbar_field_border;
          const secondaryTextColor = theme.colors.toolbar_field_highlight;
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
// ===== CONTEXT MENU ===== //

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

browser.contextMenus.create({
  id: "split-tabs-context-submenu-toggle-orientation",
  title: "Toggle orientation",
  contexts: ["all"],
});

// Handle context menu actions
browser.contextMenus.onClicked.addListener(function listener(info, activeTab) {
  console.info(info);
  if (tab?.id === activeTab?.id) {
    switch (info.menuItemId) {
      case "split-tabs-context-submenu-reverse-tabs":
        browser.tabs.sendMessage(tab.id, {
          type: "LOAD_URLS",
          leftUrl: rightUrl,
          rightUrl: leftUrl,
        });
        break;

      case "split-tabs-context-submenu-toggle-orientation":
        browser.tabs.sendMessage(tab.id, {
          type: "SET_ORIENTATION",
          orientation: undefined,
        });
        break;
    }
  }
});
