console.info("background.js > Loaded");

const defaultSettings = {
  "close-tab-before-opening": true,
  "show-rating-popup": true,
  "match-with-firefox-theme": true
};

function generateSVG(fillColor) {
  return `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="5" y="5" width="118" height="118" rx="27" stroke="${fillColor}" stroke-width="10"/>
<rect x="59" y="5" width="10" height="118" fill="${fillColor}"/>
</svg>
  `;
}

async function updateIconColor(tabId) {
  if (!tabId) return;
  try {
    const themeColors = await getThemeColors();

    let color = themeColors.textColor;
    if (!color) {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        color = "#fbfbfe"; // default icon color for dark theme in firefox
      } else color = "#4c4b51"; // default icon color for light theme in firefox
    }

    if (Array.isArray(color)) color = `rgb(${color.join(",")})`;

    console.info("updating icon color with :", color);
    // Try to get the accent color from the theme
    const svg = generateSVG(color);

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    browser.pageAction.setIcon({
      path: {
        32: url
      },
      tabId
    });

    await browser.pageAction.show(tabId);
  } catch (err) {
    console.error("Could not update icon color :", err);
  }
}

browser.tabs.onCreated.addListener((tab) => {
  updateIconColor(tab.id);
});

// Also on updated (e.g. URL change)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateIconColor(tabId);
  }
});

// When switching tabs
browser.tabs.onActivated.addListener(({ tabId }) => {
  updateIconColor(tabId);
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
          browser.tabs.sendMessage(tab.id, {
            type: "LOAD_URLS",
            leftUrl: rightUrl,
            rightUrl: leftUrl
          });
          break;

        case "split-tabs-context-submenu-toggle-orientation":
          browser.tabs.sendMessage(tab.id, {
            type: "SET_ORIENTATION",
            orientation: undefined
          });
          break;
      }
    }
  });
};

// Remove X-Frame-Options and modify Content-Security-Policy headers
// because some pages prevent being renderered into iframes
browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    let responseHeaders = details.responseHeaders;

    // Remove X-Frame-Options header
    responseHeaders = responseHeaders.filter((header) => header.name.toLowerCase() !== "x-frame-options");

    // Modify Content-Security-Policy to allow framing
    responseHeaders = responseHeaders.filter((header) => header.name.toLowerCase() !== "content-security-policy");

    return { responseHeaders };
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders"]
);

// ===== GLOBAL VARIABLES ===== //
let leftUrl = null;
let rightUrl = null;

let tab = null;

const FORBIDDEN_HOSTNAMES = [
  "accounts-static.cdn.mozilla.net",
  "accounts.firefox.com",
  "addons.cdn.mozilla.net",
  "addons.mozilla.org",
  "api.accounts.firefox.com",
  "content.cdn.mozilla.net",
  "discovery.addons.mozilla.org",
  "install.mozilla.org",
  "oauth.accounts.firefox.com",
  "profile.accounts.firefox.com",
  "support.mozilla.org",
  "sync.services.mozilla.com"
];

function isForbiddenUrl(url) {
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

async function fetchTabs(sender, sendResponse) {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    sendResponse({
      type: "TABS_DATA",
      tabs: tabs
    });
    return tabs;
  } catch (e) {
    console.error("background.js > Error while fetching tabs");
    console.error(e);
    browser.tabs.sendMessage(sender.tab.id, {
      type: "TABS_DATA",
      error: error.message
    });
    return null;
  }
}

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // Initialize extension
  console.info("[background.js] > received " + message.type);
  switch (message.type) {
    case "INIT_EXT":
      console.info("background.js > Initializing extension");
      console.info(message.side);
      handleInitializeExtension(message.side);
      break;

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
      console.info("background.js > TABS UPDATED");
      console.log(message);
      if (message.updatedLeftUrl) leftUrl = message.updatedLeftUrl;
      if (message.updatedRightUrl) rightUrl = message.updatedRightUrl;
      console.log(leftUrl, rightUrl);
      break;

    // Close one of the tabs in the split
    case "CLOSE_SPLIT":
      browser.tabs.create({
        url: message.keep === "left" ? leftUrl : rightUrl,
        active: true
      });
      browser.tabs.remove(tab.id);
      tab = null;
      break;

    case "OPEN_SETTINGS":
      await browser.tabs.create({
        url: browser.runtime.getURL("settings.html"),
        discarded: false
      });
      break;

    case "EDIT_SETTINGS":
      console.info(
        "background.js > Editing setting " +
          message.key +
          " with value : " +
          message.value +
          " (" +
          typeof message.value +
          ")"
      );
      localStorage.setItem("split-tabs-" + message.key + "-setting", message.value);
      break;

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
      break;

    case "GET_THEME":
      const theme = await browser.theme.getCurrent();
      sendThemeToFront(theme);
      break;

    default:
      break;
  }
});

async function sendThemeToFront() {
  const themeColors = await getThemeColors();

  // Send the BROWSER_COLORS data to the split-view page
  browser.tabs.sendMessage(tab.id, {
    type: "BROWSER_COLORS",
    ...themeColors
  });

  updateIconColor(tab.id);
}

async function getThemeColors() {
  try {
    // Get the current theme
    const theme = await browser.theme.getCurrent();

    console.log(theme.colors);

    const backgroundColor = theme.colors?.frame ?? theme.colors?.sidebar_highlight;
    const textColor = theme.colors?.tab_text ?? theme.colors?.toolbar_field_text;
    const inputBorder = theme.colors?.sidebar_border ?? theme.colors?.toolbar_field_border ?? theme.colors?.tab_line;
    const inputBackground = theme.colors?.toolbar_field;
    const secondaryTextColor = theme.colors?.toolbar_field_highlight;

    return {
      backgroundColor,
      textColor,
      inputBorder,
      inputBackground,
      secondaryTextColor
    };
  } catch (err) {
    return {
      backgroundColor: undefined,
      textColor: undefined,
      inputBorder: undefined,
      secondaryTextColor: undefined
    };
  }
}

browser.theme.onUpdated = function ({ theme }) {
  sendThemeToFront(theme);
  updateIconColor(tab.id);
};

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
      currentWindow: true
    });
    const activeTab = activeTabs[0];
    const currentUrl = isForbiddenUrl(activeTab.url) ? null : activeTab.url;

    // Creates a new tab containing the split view
    tab = await browser.tabs.create({
      url: browser.runtime.getURL("split-view.html"),
      discarded: false
    });

    if (getSettingValue("close-tab-before-opening") === "true") {
      console.log("Active tab", activeTab);
      browser.tabs.remove(activeTab.id);
    }

    const themeColors = await getThemeColors();

    // Wait for the tab to be fully loaded, and send informations
    browser.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
      if (tabId === tab.id && changeInfo.status === "complete") {
        // Remove the listener to avoid multiple calls
        browser.tabs.onUpdated.removeListener(listener);

        leftUrl = side === "left" || side === "top" ? currentUrl : null;
        rightUrl = side === "right" || side === "bottom" ? currentUrl : null;

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
