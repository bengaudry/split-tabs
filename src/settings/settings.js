console.info("settings.js > Loaded");

const settingsList = ["close-tab-before-opening", "show-rating-popup", "match-with-firefox-theme"];

document.addEventListener("DOMContentLoaded", async () => {
  for (const setting of settingsList) {
    const settingInput = document.getElementById(setting);
    if (!settingInput) {
      console.warn(`Setting input with ID "${setting}" not found.`);
      continue;
    }

    settingInput.addEventListener("click", (e) => {
      browser.runtime.sendMessage({
        type: "EDIT_SETTINGS",
        key: setting,
        value: e.target.checked
      });
    });

    // Request the current value of the setting
    const response = await browser.runtime.sendMessage({
      type: "GET_SETTING",
      key: setting
    });

    if (response.type !== "SETTING_VALUE") continue;
    if (settingInput.type === "checkbox") {
      settingInput.checked = response.value === "false" ? false : true;
    } else {
      settingInput.value = response.value;
    }
  }
});
