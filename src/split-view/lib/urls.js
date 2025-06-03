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
 * Returns true if the string is url like
 * @param {string} str
 * @returns {boolean}
 */
export function isUrlLike(str) {
  const urlPattern =
    /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([\/?#].*)?$/;
  return urlPattern.test(str);
}

/**
 * Checks if a string is a valid URL
 * @param {string} url
 * @returns
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Adds a protocol to a url if it is not url like
 * @param {string} url - A url with or without protocol
 * @returns
 */
export function addProtocolToUrl(url) {
  if (!isValidUrl(url)) {
    return "https://" + url;
  }
  return url;
}
