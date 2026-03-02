import { Branded } from "../utils/types";

export type TabId = Branded<number, "TabId">;

export type Side = "left" | "right" | "top" | "bottom";

export type Tab = browser.tabs.Tab;
export type MessageSender = browser.runtime.MessageSender;
export type Theme = browser._manifest.ThemeType;
