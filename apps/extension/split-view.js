// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOAD_URLS") {
    loadUrls(message.leftUrl, message.rightUrl);
  }
});

async function loadUrls(leftUrl, rightUrl) {
  // Create a new window with our split view
  const window = await browser.windows.create({
    url: browser.runtime.getURL("split-view.html"),
    type: "popup",
    width: 1200,
    height: 800,
  });

  // Wait for the window to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Create tabs in the left and right panes
  const leftTab = await browser.tabs.create({
    url: leftUrl,
    windowId: window.id,
  });

  const rightTab = await browser.tabs.create({
    url: rightUrl,
    windowId: window.id,
  });

  // Move the tabs to their respective positions
  await browser.tabs.move(leftTab.id, { windowId: window.id, index: 0 });
  await browser.tabs.move(rightTab.id, { windowId: window.id, index: 1 });
}
