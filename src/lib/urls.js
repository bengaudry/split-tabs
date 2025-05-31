/** 
 * Returns an array of urls that are allowed to be opened in the split view 
 * @param {string[]} urls 
 * @returns {string[]}
 */
export function filterIncorrectUrls(urls) {
  return urls.filter(
    (tab) =>
      !tab.url.startsWith("moz-extension://") && !tab.url.startsWith("about:")
  );
}

/** 
 * Returns the base of the url ("https://www.example.com" -> "example.com") 
 * @param {string} url 
 * @returns {string}
 */
export function getUrlBase(url) {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("file://", "")
    .replace("www.", "");
}

/**
 * Returns true if the url starts with a known protocol
 * @param {string} url 
 * @returns {boolean}
 */
export function isUrlLike(url) {
  return url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("file://")
}

/**
 * Adds a protocol to a url if it is not url like
 * @param {string} url - A url with or without protocol
 * @returns 
 */
export function addProtocolToUrl(url) {
  if (!isUrlLike(url)) {
    return "https://" + url;
  }
  return url;
}
