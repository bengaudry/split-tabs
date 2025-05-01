/** Returns a tab of urls that are allowed to be opened in the split view */
export function filterIncorrectUrls(urls) {
  return urls.filter(
    (tab) =>
      !tab.url.startsWith("moz-extension://") && !tab.url.startsWith("about:")
  );
}

/** Returns the base of the url ("https://www.example.com" -> "example.com") */
export function getUrlBase(url) {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("file://", "")
    .replace("www.", "");
}

export function addProtocolToUrl(url) {
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("file://")
  ) {
    return "https://" + url;
  }

  return url;
}
