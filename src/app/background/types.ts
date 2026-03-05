import { Branded } from "../../shared/types";

export type ThemeColors = {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  activeBorderColor?: string;
  inputBackground?: string;
  secondaryTextColor?: string;
  iconsColor?: string;
};

export type BrowserTabId = Branded<number, "TabId">;

export type BrowserTab = browser.tabs.Tab;
export type BrowserMessageSender = browser.runtime.MessageSender;
export type BrowserTheme = browser._manifest.ThemeType;
