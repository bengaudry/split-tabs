// Handle the browser action click
browser.browserAction.onClicked.addListener(async () => {
  // Get the current tab's URL
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tabs[0].url;

  // Create a new window with split view
  const window = await browser.windows.create({
      url: browser.runtime.getURL('split-view.html'),
      type: 'popup',
      width: 1200,
      height: 800
  });

  // Wait for the window to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create two tabs with the same URL
  const leftTab = await browser.tabs.create({
      url: currentUrl,
      windowId: window.id
  });

  const rightTab = await browser.tabs.create({
      url: currentUrl,
      windowId: window.id
  });

  // Move the tabs to their respective positions
  await browser.tabs.move(leftTab.id, { windowId: window.id, index: 0 });
  await browser.tabs.move(rightTab.id, { windowId: window.id, index: 1 });
});
