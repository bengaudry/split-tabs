import { FORBIDDEN_HOSTNAMES } from "../utils/constants";
import { updateIcons } from "./icons";
import { getThemeColors, sendThemeToFront } from "./theme";
import { MessageSender, Side, Tab, TabId, Theme } from "./types";

console.info("background.js > Loaded");

const defaultSettings = {
  "close-tab-before-opening": true,
  "show-rating-popup": true,
  "match-with-firefox-theme": true
};

/* ===== Listeners for page icon & tab icon ===== */

browser.tabs.onCreated.addListener((tab) => {
  updateIcons(tab.id);
});

// Also on updated (e.g. URL change)
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    updateIcons(tabId);
  }
});

// When switching tabs
browser.tabs.onActivated.addListener(({ tabId }) => {
  updateIcons(tabId);
});

/**
 * Creates the context menu available on right-click
 */
const createContextMenu = () => {
  browser.contextMenus.create({
    id: "split-tabs-context-menu",
    type: "separator",
    title: "Split tabs",
    contexts: ["all"]
  });

  browser.contextMenus.create({
    id: "split-tabs-context-submenu-reverse-tabs",
    title: "Reverse tabs",
    contexts: ["all"]
  });

  browser.contextMenus.create({
    id: "split-tabs-context-submenu-toggle-orientation",
    title: "Toggle orientation",
    contexts: ["all"]
  });

  // Handle context menu actions
  browser.contextMenus.onClicked.addListener(function listener(info, activeTab) {
    console.info(info);
    if (tab?.id === activeTab?.id) {
      switch (info.menuItemId) {
        case "split-tabs-context-submenu-reverse-tabs":
          if (tab?.id !== undefined) {
            browser.tabs.sendMessage(tab.id, {
              type: "LOAD_URLS",
              leftUrl: rightUrl,
              rightUrl: leftUrl
            });
          }
          break;

        case "split-tabs-context-submenu-toggle-orientation":
          if (tab?.id !== undefined) {
            browser.tabs.sendMessage(tab.id, {
              type: "SET_ORIENTATION",
              orientation: undefined
            });
            break;
          }
      }
    }
  });
};

// Remove X-Frame-Options and modify Content-Security-Policy headers
// because some pages prevent being renderered into iframes
browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    let responseHeaders = details.responseHeaders;

    if (responseHeaders) {
      // Remove X-Frame-Options header
      responseHeaders = responseHeaders.filter((header) => header.name.toLowerCase() !== "x-frame-options");

      // Modify Content-Security-Policy to allow framing
      responseHeaders = responseHeaders.filter((header) => header.name.toLowerCase() !== "content-security-policy");
    }

    return { responseHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);

// ===== GLOBAL VARIABLES ===== //
let leftUrl: string | null = null;
let rightUrl: string | null = null;

let tab: Tab | null = null;

function isForbiddenUrl(url: string | undefined | null) {
  if (!url) return true;
  if (url.startsWith("moz-extension:")) return true;
  if (url.startsWith("about:")) return true;
  if (url.startsWith("file:")) return true;
  try {
    const urlObj = new URL(url);
    if (FORBIDDEN_HOSTNAMES.includes(urlObj.hostname)) return true;
  } catch (_) {
    return true;
  }
  return false;
}

async function fetchTabs(sender: MessageSender, sendResponse: (response?: any) => void) {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    sendResponse({
      type: "TABS_DATA",
      tabs: tabs
    });
    return tabs;
  } catch (error) {
    console.error("background.js > Error while fetching tabs");
    console.error(error);
    if (sender.tab && sender.tab.id) {
      browser.tabs.sendMessage(sender.tab.id, {
        type: "TABS_DATA",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
    return null;
  }
}

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // Initialize extension
  console.info("[background.js] > received " + message.type);
  switch (message.type) {
    case "INIT_EXT":
      console.info("[background.js] > Initializing extension");
      console.info(message.side);
      handleInitializeExtension(message.side);
      return null;

    // Fetch opened tabs on browser to make suggestions to user
    case "FETCH_TABS":
      // Query all tabs in the current window
      const tabs = await fetchTabs(sender, sendResponse);
      return {
        type: "TABS_DATA",
        tabs: tabs
      };

    // Update global variables when changing url in split view
    case "UPDATE_TABS":
      console.info("[background.js] > TABS UPDATED");
      console.log(message);
      if (message.updatedLeftUrl) leftUrl = message.updatedLeftUrl;
      if (message.updatedRightUrl) rightUrl = message.updatedRightUrl;
      console.log(leftUrl, rightUrl);
      return null;

    // Close one of the tabs in the split
    case "CLOSE_SPLIT":
      const urlToKeep = message.keep === "left" ? leftUrl : rightUrl;
      if (urlToKeep && tab?.id !== undefined) {
        browser.tabs.create({
          url: urlToKeep,
          active: true
        });
        browser.tabs.remove(tab?.id);
        tab = null;
      }
      return null;

    case "OPEN_SETTINGS":
      await browser.tabs.create({
        url: browser.runtime.getURL("settings.html"),
        discarded: false
      });
      return null;

    case "EDIT_SETTINGS":
      console.info(
        "[background.js] > Editing setting " +
          message.key +
          " with value : " +
          message.value +
          " (" +
          typeof message.value +
          ")"
      );
      localStorage.setItem("split-tabs-" + message.key + "-setting", message.value);
      return null;

    case "GET_SETTING":
      console.info("[background.js] > Returning SETTING_VALUE");
      return {
        type: "SETTING_VALUE",
        key: message.key,
        value: getSettingValue(message.key)
      };

    case "OPEN_EXTERNAL_URL":
      await browser.tabs.create({
        url: message.url,
        discarded: false
      });
      return null;

    case "GET_THEME":
      const theme = await browser.theme.getCurrent();
      if (tab?.id === undefined) return null;
      sendThemeToFront(tab.id as TabId, theme);
      return null;

    default:
      return null;
  }
});

browser.theme.onUpdated.addListener(function ({ theme }) {
  if (tab?.id === undefined) return;
  sendThemeToFront(tab.id as TabId, theme);
  updateIcons(tab.id as TabId);
});

/**
 * Returns the setting value for a given setting key
 */
const getSettingValue = (key: keyof typeof defaultSettings) => {
  const settingValue = localStorage.getItem("split-tabs-" + key + "-setting");
  return settingValue ?? defaultSettings[key] ?? null;
};

const handleInitializeExtension = async (side: Side) => {
  try {
    // Get the current tab's URL
    const activeTabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = activeTabs[0];

    if (!activeTab?.id) {
      console.error("background.js > No active tab found");
      return;
    }

    const currentUrl = isForbiddenUrl(activeTab.url) ? null : activeTab.url;

    // Creates a new tab containing the split view
    tab = await browser.tabs.create({
      url: browser.runtime.getURL("split-view.html"),
      discarded: false
    });

    if (!tab?.id) {
      console.error("background.js > Could not create new tab for split view");
      return;
    }

    if (getSettingValue("close-tab-before-opening") === "true") {
      console.log("Active tab", activeTab);
      browser.tabs.remove(activeTab.id);
    }

    const themeColors = await getThemeColors(await browser.theme.getCurrent());

    // Wait for the tab to be fully loaded, and send informations
    browser.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
      if (tab?.id && tabId === tab.id && changeInfo.status === "complete") {
        // Remove the listener to avoid multiple calls
        browser.tabs.onUpdated.removeListener(listener);

        leftUrl = side === "left" || side === "top" ? (currentUrl ?? null) : null;
        rightUrl = side === "right" || side === "bottom" ? (currentUrl ?? null) : null;

        console.info("background.js > Sending SET_ORIENTATION");
        browser.tabs.sendMessage(tab.id, {
          type: "SET_ORIENTATION",
          orientation: side === "top" || side === "bottom" ? "vertical" : "horizontal"
        });

        console.info("background.js > Sending LOAD_URLS");
        // Send the LOAD_URLS event to the split-view page
        browser.tabs.sendMessage(tab.id, {
          type: "LOAD_URLS",
          leftUrl,
          rightUrl
        });

        console.info("background.js > Sending BROWSER_COLORS");
        // Send the BROWSER_COLORS data to the split-view page
        browser.tabs.sendMessage(tab.id, {
          type: "BROWSER_COLORS",
          ...themeColors
        });
      }
    });

    createContextMenu();
  } catch (err) {
    console.error("background.js > Error while initializing extension :");
    console.error(err);
  }
};
