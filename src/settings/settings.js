console.info("settings.js > Loaded");

const settingsList = ["close-tab-before-opening"];

document.addEventListener("DOMContentLoaded", async () => {
  for (const setting of settingsList) {
    await browser.runtime.sendMessage({
      type: "GET_SETTING",
      key: setting,
    });
    document.getElementById(setting)?.addEventListener("click", (e) => {
      browser.runtime.sendMessage({
        type: "EDIT_SETTINGS",
        key: setting,
        value: e.target.checked,
      });
    });
  }
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log(message)
  if (message.type === "SETTING_VALUE") {
    const toggle = document.getElementById(message.key);
    if (toggle) {
      console.log(message.value, typeof message.value);
      toggle.checked = Boolean(message.value);
    }
  }
});
