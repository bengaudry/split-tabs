import { Branded } from "../../shared/types";

export type TabId = Branded<number, "TabId">;

export type ThemeColors = {
  backgroundColor?: string;
  textColor?: string;
  inputBorder?: string;
  inputBackground?: string;
  secondaryTextColor?: string;
};

export type Tab = browser.tabs.Tab;
export type MessageSender = browser.runtime.MessageSender;
export type Theme = browser._manifest.ThemeType;
