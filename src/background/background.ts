import { FORBIDDEN_HOSTNAMES } from "../shared/constants";
import { updateIcons } from "./icons";
import { BackgroundContext } from "./BackgroundContext";
import { getThemeColors, sendThemeToFront } from "./theme";
import { MessageSender, TabId } from "./types";
import { Side } from "../shared/types";
import { createContextMenu } from "./contextMenu";

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

async function fetchTabs(sender: MessageSender, sendResponse: (response?: any) => void) {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    sendResponse({
      type: "TABS_DATA",
      tabs: tabs
    });
    return tabs;
  } catch (error) {
    console.error("background.ts > Error while fetching tabs");
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
      console.info("[background.ts] > Initializing extension");
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

    case "GET_THEME":
      if (tab?.id === undefined) return null;
      const theme = await browser.theme.getCurrent();
      sendThemeToFront(tab.id as TabId, theme);
      return null;

    default:
      return null;
  }
});

browser.theme.onUpdated.addListener(function ({ theme }) {
  const context = BackgroundContext.getInstance();
  const tab = context.getTab();
  if (tab?.id === undefined) return;
  sendThemeToFront(tab.id as TabId, theme);
  updateIcons(tab.id as TabId);
});

const handleInitializeExtension = async (side: Side) => {
  try {
    // Get the current tab's URL
    const activeTabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = activeTabs[0];

    if (!activeTab?.id) {
      console.error("background.ts > No active tab found");
      return;
    }

    const currentUrl = isForbiddenUrl(activeTab.url) ? null : activeTab.url;

    // Creates a new tab containing the split view
    const splitViewTab = await browser.tabs.create({
      url: browser.runtime.getURL("split-view.html"),
      discarded: false
    });

    if (!splitViewTab?.id) {
      console.error("background.ts > Could not create new tab for split view");
      return;
    }

    BackgroundContext.getInstance(); // initialize the singleton instance of BackgroundContext, which will dispatch the INIT_EXTENSION event to the split page

    const context = BackgroundContext.getInstance();
    context.setTab(splitViewTab);

    console.log(context.getSetting("close-tab-before-opening"));
    if (Boolean(context.getSetting("close-tab-before-opening"))) {
      console.log("Active tab", activeTab);
      browser.tabs.remove(activeTab.id);
    }

    const themeColors = await getThemeColors(await browser.theme.getCurrent());

    // Wait for the tab to be fully loaded, and send informations
    browser.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
      if (splitViewTab?.id && tabId === splitViewTab.id && changeInfo.status === "complete") {
        // Remove the listener to avoid multiple calls
        browser.tabs.onUpdated.removeListener(listener);

        context.setLeftUrl(side === "left" || side === "top" ? (currentUrl ?? null) : null);
        context.setRightUrl(side === "right" || side === "bottom" ? (currentUrl ?? null) : null);

        console.info("background.ts > Sending SET_ORIENTATION");
        browser.tabs.sendMessage(splitViewTab.id, {
          type: "SET_ORIENTATION",
          orientation: side === "top" || side === "bottom" ? "vertical" : "horizontal"
        });

        console.info("background.ts > Sending LOAD_URLS");
        // Send the LOAD_URLS event to the split-view page
        browser.tabs.sendMessage(splitViewTab.id, {
          type: "LOAD_URLS",
          leftUrl: context.getLeftUrl(),
          rightUrl: context.getRightUrl()
        });

        console.info("background.ts > Sending BROWSER_COLORS");
        // Send the BROWSER_COLORS data to the split-view page
        browser.tabs.sendMessage(splitViewTab.id, {
          type: "BROWSER_COLORS",
          ...themeColors
        });
      }
    });

    createContextMenu();
  } catch (err) {
    console.error("background.ts > Error while initializing extension :");
    console.error(err);
  }
};
