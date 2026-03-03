import { BackgroundContext } from "./BackgroundContext";
import { TabId } from "./types";

const contextMenuItems = [
  {
    title: "Reverse tabs",
    id: "reverse-tabs",
    onClick: (tabId: TabId | undefined) => {
      if (!tabId) return;
      const context = BackgroundContext.getInstance();
      const leftUrl = context.getLeftUrl();
      const rightUrl = context.getRightUrl();
      context.setLeftUrl(rightUrl ?? null);
      context.setRightUrl(leftUrl ?? null);
    }
  },
  {
    title: "Toggle orientation",
    id: "toggle-orientation",
    onClick: (tabId: TabId | undefined) => {
      if (!tabId) return;
      const context = BackgroundContext.getInstance();
      context.toggleOrientation();
    }
  }
];

/**
 * Creates the context menu available on right-click
 */
export function createContextMenu() {
  browser.contextMenus.create({
    id: "split-tabs-context-menu",
    type: "separator",
    title: "Split tabs",
    contexts: ["all"]
  });

  const clickMap = new Map<string, (tabId: TabId | undefined) => void>();

  for (const { id, title, onClick } of contextMenuItems) {
    browser.contextMenus.create({
      id: "split-tabs-context-submenu-" + id,
      title,
      contexts: ["all"]
    });
    clickMap.set(id, onClick);
  }

  browser.contextMenus.onClicked.addListener((info, activeTab) => {
    const context = BackgroundContext.getInstance();
    const tab = context.getTab();

    if (!activeTab?.id) return;
    if (tab?.id !== activeTab.id) return;

    if (typeof info.menuItemId !== "string") return;

    const onClick = clickMap.get(info.menuItemId.replace("split-tabs-context-submenu-", ""));
    if (onClick) {
      onClick(activeTab.id as TabId);
    }
  });
}
