document.getElementById("split-view-button").addEventListener("click", () => {
  browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    let activeTab = tabs[0];
    browser.tabs
      .create({
        url: activeTab.url,
        active: false,
      })
      .then((newTab) => {
        browser.windows.update(activeTab.windowId, {
          state: "maximized",
        });
        browser.tabs.update(newTab.id, {
          active: true,
        });
      });
  });
});
