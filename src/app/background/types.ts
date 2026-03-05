import { Branded } from "../../shared/types";

export type TabId = Branded<number, "TabId">;

export type ThemeColors = {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  activeBorderColor?: string;
  inputBackground?: string;
  secondaryTextColor?: string;
  iconsColor?: string;
};

export type Tab = browser.tabs.Tab;
export type MessageSender = browser.runtime.MessageSender;
export type Theme = browser._manifest.ThemeType;
