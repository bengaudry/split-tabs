function afficherTabs(tabs) {
  console.log(tabs);
}

console.log(browser);

browser.tabs.query({ currentWindow: true }, afficherTabs);

browser.tabs
  .create({
    url: "file:///C:/Users/benou/Desktop/firefox-split-view/page.html",
  })
  .then((tab) => {
    console.log(`Created new tab with ID: ${tab.id}`);
  })
  .catch((error) => {
    console.error(`Error creating new tab: ${error}`);
  });
