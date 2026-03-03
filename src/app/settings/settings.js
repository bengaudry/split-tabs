console.info("settings.js > Loaded");

const settingsList = ["close-tab-before-opening", "match-with-firefox-theme"];

document.addEventListener("DOMContentLoaded", async () => {
  for (const setting of settingsList) {
    const settingInput = document.getElementById(setting);
    if (!settingInput) {
      console.warn(`Setting input with ID "${setting}" not found.`);
      continue;
    }

    settingInput.addEventListener("click", (e) => {
      browser.runtime.sendMessage({
        sender: "settings",
        type: "UPDATE_SETTING",
        key: setting,
        value: e.target.checked
      });
    });

    // Request the current value of the setting
    const response = await browser.runtime.sendMessage({
      sender: "settings",
      type: "GET_SETTING",
      key: setting
    });

    console.log(`Received setting value for "${setting}": `, response);

    if (response.type !== "SETTING_VALUE") continue;
    if (settingInput.type === "checkbox") {
      settingInput.checked = Boolean(response.value);
    } else {
      settingInput.value = response.value;
    }
  }
});
