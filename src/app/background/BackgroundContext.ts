import { Context } from "../../shared/Context";
import {
  BackgroundEvent,
  BackgroundEventType,
  InitExtensionBackgroundEvent,
  UpdateLeftUrlBackgroundEvent,
  UpdateOrientationBackgroundEvent,
  UpdateRightUrlBackgroundEvent,
  UpdateThemeColorsBackgroundEvent
} from "./BackgroundEvents";
import { SplitEvent, UpdateSettingSplitEvent, UpdateUrlsSplitEvent } from "../split-view/lib/SplitEvents";
import { BrowserTab, ThemeColors } from "./types";
import type { Orientation } from "../../shared/types";

export class BackgroundContext extends Context {
  private static instance: BackgroundContext;

  private tab: BrowserTab | null;
  private dispatchNextEvent: boolean = true;

  private constructor() {
    super();
    this.tab = null;
  }

  public static getInstance(): BackgroundContext {
    if (!BackgroundContext.instance) {
      BackgroundContext.instance = new BackgroundContext();
    }
    return BackgroundContext.instance;
  }

  public setLeftUrl(url: string | null) {
    this.leftUrl = url;
    this.dispatchToSplit("UPDATE_LEFT_URL");
  }

  public setRightUrl(url: string | null) {
    this.rightUrl = url;
    this.dispatchToSplit("UPDATE_RIGHT_URL");
  }

  public setOrientation(orientation: Orientation) {
    this.orientation = orientation;
    this.dispatchToSplit("UPDATE_ORIENTATION");
  }

  public setThemeColors(themeColors: ThemeColors) {
    this.themeColors = themeColors;
    this.dispatchToSplit("UPDATE_THEME_COLORS");
  }

  public toggleOrientation() {
    this.orientation = this.orientation === "horizontal" ? "vertical" : "horizontal";
    this.dispatchToSplit("UPDATE_ORIENTATION");
  }

  public setTab(tab: BrowserTab | null) {
    this.tab = tab;
  }

  public setSetting(key: string, value: string | number | boolean) {
    this.settings[key] = value;
    this.dispatchToSplit("UPDATE_SETTING");
    localStorage.setItem("split-tabs-" + key + "-setting", value.toString());
  }

  public getTab() {
    return this.tab;
  }

  /**
   * Dispatches an event to the split page (if open) to update it with the latest context values.
   * @param event The type of event to dispatch, which determines what the split page should update.
   * For example, if the event is "UPDATE_LEFT_URL", the split page should update the left URL it displays.
   * If the event is "UPDATE_ORIENTATION", the split page should update its layout orientation, etc.
   * The split page will listen for these events and update itself accordingly.
   * Note: This function assumes that the split page is open and has a listener for the dispatched events.
   * If the split page is not open, the dispatched event will not be received by any listener, but it will still update the context values in this class.
   */
  public dispatchToSplit(eventType: BackgroundEventType) {
    if (!this.dispatchNextEvent) return; // Prevent dispatching if the flag is set to false (to avoid feedback loops)

    const tabId = this.getTab()?.id;
    if (tabId === undefined) {
      console.warn("Warning: Could not send context update to split page because tab ID is undefined.");
      return;
    }

    let event: BackgroundEvent;
    switch (eventType) {
      case "UPDATE_LEFT_URL":
        event = new UpdateLeftUrlBackgroundEvent(this.leftUrl);
        break;
      case "UPDATE_RIGHT_URL":
        event = new UpdateRightUrlBackgroundEvent(this.rightUrl);
        break;
      case "UPDATE_ORIENTATION":
        event = new UpdateOrientationBackgroundEvent(this.orientation);
        break;
      case "UPDATE_THEME_COLORS":
        event = new UpdateThemeColorsBackgroundEvent(this.themeColors);
        break;
      case "INIT_EXTENSION":
        const side = this.leftUrl && !this.rightUrl ? "left" : !this.leftUrl && this.rightUrl ? "right" : "left";
        event = new InitExtensionBackgroundEvent({
          side,
          url: side === "left" ? this.leftUrl : this.rightUrl,
          orientation: this.orientation,
          themeColors: this.themeColors,
          settings: this.settings
        });
        break;
      default:
        console.warn(`Warning: Unknown background event type "${eventType}"`);
        return;
    }

    browser.tabs.sendMessage(tabId, { sender: "background", event });
  }

  /**
   * This function is called when the background script receives an event from the split page.
   * @param event The event received from the split page, which should be an instance of SplitEvent. It contains the type of event and any relevant context data sent by the split page.
   * The function checks the type of the event and updates the background context accordingly. For example, if the event type is "UPDATE_TABS", it will update the left and right URLs in the context based on the data sent by the split page. If the event type is "UPDATE_SETTING", it will update a specific setting in the context.
   * The function also uses a flag (dispatchNextEvent) to prevent feedback loops of events between the background and split page. When it receives an event from the split page, it sets this flag to false to prevent any updates made in response to this event from being dispatched back to the split page, which could cause an infinite loop of events being sent back and forth.
   * @returns
   */
  public updateFromSplitDispatch(event: SplitEvent) {
    this.dispatchNextEvent = false; // Prevent feedback loop of events between background and split page

    console.info(
      `[BackgroundContext] > Received event of type "${event.type}" from split page : updating background context`,
      event
    );

    switch (event.type) {
      case "UPDATE_URLS": {
        const updateUrlsEvent = event as UpdateUrlsSplitEvent;
        if (updateUrlsEvent.leftUrl !== undefined) this.setLeftUrl(updateUrlsEvent.leftUrl);
        if (updateUrlsEvent.rightUrl !== undefined) this.setRightUrl(updateUrlsEvent.rightUrl);
        break;
      }
      case "UPDATE_SETTING": {
        const updateSettingEvent = event as UpdateSettingSplitEvent;
        this.setSetting(updateSettingEvent.key, updateSettingEvent.value);
        break;
      }
      default:
        console.warn(`Warning: Received unknown event type "${event.type}" from split page.`, event);
        break;
    }

    console.info("New background context after processing event (" + event.type + ") from split page:", {
      leftUrl: this.leftUrl,
      rightUrl: this.rightUrl,
      orientation: this.orientation,
      themeColors: this.themeColors,
      settings: this.settings
    });

    this.dispatchNextEvent = true; // Reset the flag for the next event if the event type is not recognized
  }
}
