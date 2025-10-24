export const FORBIDDEN_HOSTNAMES = [
  "accounts-static.cdn.mozilla.net",
  "accounts.firefox.com",
  "addons.cdn.mozilla.net",
  "addons.mozilla.org",
  "api.accounts.firefox.com",
  "content.cdn.mozilla.net",
  "discovery.addons.mozilla.org",
  "install.mozilla.org",
  "oauth.accounts.firefox.com",
  "profile.accounts.firefox.com",
  "support.mozilla.org",
  "sync.services.mozilla.com",
];

/** Returns an array of urls that are allowed to be opened in the split view */
export function filterIncorrectTabs(
  tabs: Array<{
    url: string;
    lastAccessed: number;
    favIconUrl: string;
    title: string;
  }>
) {
  return tabs.filter((tab) => {
    if (tab.url.startsWith("moz-extension:")) return false;
    if (tab.url.startsWith("about:")) return false;
    if (tab.url.startsWith("file:")) return false;
    const urlObj = new URL(tab.url);
    if (isUrlLike(tab.url) && FORBIDDEN_HOSTNAMES.includes(urlObj.hostname))
      return false;
    return true;
  });
}

/** Returns the base of the url ("https://www.example.com" -> "example.com") */
export function getUrlBase(url: string) {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("file://", "")
    .replace("www.", "");
}

/** Returns true if the string is url like */
export function isUrlLike(str: string) {
  const urlPattern =
    /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}([\/?#].*)?$/;
  return urlPattern.test(str);
}

/** Checks if a string is a valid URL */
export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/** Adds a protocol to a url if it is not url like */
export function addProtocolToUrl(url: string) {
  if (!isValidUrl(url)) {
    return "http://" + url;
  }
  return url;
}
