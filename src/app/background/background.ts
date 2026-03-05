import { FORBIDDEN_HOSTNAMES } from "shared/constants";
import { updateIcons } from "./icons";
import { BackgroundContext } from "./BackgroundContext";
import { getPrefferedUserScheme, getThemeColors } from "shared/themes/utils";
import { BrowserMessageSender, BrowserTab } from "./types";
import { Side } from "shared/types";
import { createContextMenu } from "./contextMenu";
import { knownThemesColors } from "shared/themes/knownThemesColors";

console.info("[background.ts] > Loaded");

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

async function fetchTabs(sender: BrowserMessageSender, sendResponse: (response?: any) => void) {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    sendResponse({
      type: "TABS_DATA",
      tabs: tabs
    });
    return tabs;
  } catch (error) {
    console.error("background.ts > Error while fetching tabs", error);
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
  console.info("[background.ts] > received " + message.type);

  const context = BackgroundContext.getInstance();
  const tab = context.getTab();

  if (message.sender === "split") {
    context.updateFromSplitDispatch(message.event);
  }

  if (message.sender === "settings") {
    switch (message.type) {
      case "UPDATE_SETTING":
        context.setSetting(message.key, message.value);
        return null;

      case "GET_SETTING":
        return {
          type: "SETTING_VALUE",
          key: message.key,
          value: context.getSetting(message.key)
        };

      default:
        return null;
    }
  }

  switch (message.type) {
    case "INIT_EXT":
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

    // Close one of the tabs in the split
    case "CLOSE_SPLIT":
      const urlToKeep = message.keep === "left" ? context.getLeftUrl() : context.getRightUrl();
      if (urlToKeep && tab?.id !== undefined) {
        browser.tabs.create({
          url: urlToKeep,
          active: true
        });
        browser.tabs.remove(tab?.id);
        context.setTab(null);
      }
      return null;

    case "OPEN_SETTINGS":
      await browser.tabs.create({
        url: browser.runtime.getURL("settings.html"),
        discarded: false
      });
      return null;

    case "OPEN_EXTERNAL_URL":
      await browser.tabs.create({
        url: message.url,
        discarded: false
      });
      return null;

    default:
      return null;
  }
});

browser.theme.onUpdated.addListener(function ({ theme }) {
  const context = BackgroundContext.getInstance();

  getThemeColors(theme).then((themeColors) => {
    context.setThemeColors(themeColors);
    updateIcons(context.getTab()?.id);
  });
});

function getActiveTab(): Promise<BrowserTab | null> {
  return browser.tabs
    .query({
      active: true,
      currentWindow: true
    })
    .then((tabs) => {
      if (tabs.length > 0) {
        return tabs[0] ?? null;
      }
      return null;
    })
    .catch((error) => {
      console.error("background.ts > Error while getting active tab:", error);
      return null;
    });
}

const handleInitializeExtension = async (side: Side) => {
  try {
    // Get the current tab's URL
    const activeTab = await getActiveTab();

    if (!activeTab?.id) {
      console.error("background.ts > No active tab found");
      return;
    }

    // initialize context
    const currentUrl = isForbiddenUrl(activeTab.url) ? null : activeTab.url;

    const context = BackgroundContext.getInstance();

    if (Boolean(context.getSetting("close-tab-before-opening"))) {
      browser.tabs.remove(activeTab.id);
    }

    const themeColors = await getThemeColors();
    context.setThemeColors(themeColors);

    context.setLeftUrl(side === "left" || side === "top" ? (currentUrl ?? null) : null);
    context.setRightUrl(side === "right" || side === "bottom" ? (currentUrl ?? null) : null);
    context.setOrientation(side === "top" || side === "bottom" ? "vertical" : "horizontal");

    // Creates a new tab containing the split view
    const splitViewTab = await browser.tabs.create({
      url: browser.runtime.getURL("split-view.html"),
      discarded: false
    });

    if (!splitViewTab?.id) {
      console.error("background.ts > Could not create new tab for split view");
      return;
    }

    context.setTab(splitViewTab);

    // Wait for the tab to be fully loaded, and send informations
    browser.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (splitViewTab?.id && tabId === splitViewTab.id && changeInfo.status === "complete") {
        // Remove the listener to avoid multiple calls
        browser.tabs.onUpdated.removeListener(listener);
        context.dispatchToSplit("INIT_EXTENSION");
      }
    });

    createContextMenu();
  } catch (err) {
    console.error("background.ts > Error while initializing extension :", err);
  }
};
