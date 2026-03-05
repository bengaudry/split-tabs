import { Branded } from "shared/types";

export type BrowserTabId = Branded<number, "TabId">;

export type BrowserTab = browser.tabs.Tab;
export type BrowserMessageSender = browser.runtime.MessageSender;
export type BrowserTheme = browser._manifest.ThemeType;
