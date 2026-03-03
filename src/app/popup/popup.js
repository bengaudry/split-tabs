// ===== TRIGGERS ===== //
const leftTrigger = document.getElementById("left-trigger");
const rightTrigger = document.getElementById("right-trigger");
const topTrigger = document.getElementById("top-trigger");
const bottomTrigger = document.getElementById("bottom-trigger");

leftTrigger?.addEventListener("click", () => {
  console.info("clicked");
  browser.runtime.sendMessage({
    type: "INIT_EXT",
    side: "left"
  });
});

rightTrigger?.addEventListener("click", () => {
  console.info("clicked");
  browser.runtime.sendMessage({
    type: "INIT_EXT",
    side: "right"
  });
});

topTrigger?.addEventListener("click", () => {
  console.info("clicked");
  browser.runtime.sendMessage({
    type: "INIT_EXT",
    side: "top"
  });
});

bottomTrigger?.addEventListener("click", () => {
  console.info("clicked");
  browser.runtime.sendMessage({
    type: "INIT_EXT",
    side: "bottom"
  });
});

// ===== ACTIONS ===== //
const settingsActionBtn = document.getElementById("action-settings");

settingsActionBtn?.addEventListener("click", () => {
  browser.runtime.sendMessage({
    type: "OPEN_SETTINGS"
  });
});
