import { Context } from "../../shared/Context";
import {
  BackgroundEvent,
  InitExtensionBackgroundEvent,
  UpdateLeftUrlBackgroundEvent,
  UpdateOrientationBackgroundEvent,
  UpdateRightUrlBackgroundEvent,
  UpdateThemeColorsBackgroundEvent
} from "../../background/BackgroundEvents";
import { SplitEvent, SplitEventType, UpdateSettingSplitEvent, UpdateUrlsSplitEvent } from "./SplitEvents";
import { Observable } from "../../shared/observability/Observable";
import { Observer } from "../../shared/observability/Observer";
import { Orientation, Side } from "../../shared/types";

export class SplitContext extends Context implements Observable<SplitContext> {
  private static instance: SplitContext;
  private dispatchNextEvent: boolean = true;

  /* === Observability === */
  private observers: Observer<SplitContext>[] = [];

  public addObserver(observer: Observer<SplitContext>) {
    this.observers.push(observer);
  }

  public removeObserver(observer: Observer<SplitContext>) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  public notifyObservers() {
    if (this.observers.length === 0) {
      console.warn("Warning: No observers to notify for SplitContext");
    }

    this.observers.forEach((observer) => observer.update(this));
  }

  private constructor() {
    super();
  }

  public updateUrl(side: Side, url: string | null) {
    console.info("[SplitContext] > Updating URL for side " + side + ": " + url);
    if (side === "left") {
      this.leftUrl = url;
    } else {
      this.rightUrl = url;
    }
    this.dispatchToBackground("UPDATE_URLS");
    this.notifyObservers();
  }

  public updateUrls(leftUrl: string | null, rightUrl: string | null) {
    this.leftUrl = leftUrl;
    this.rightUrl = rightUrl;
    this.dispatchToBackground("UPDATE_URLS");
    this.notifyObservers();
  }

  public updateOrientation(orientation: Orientation) {
    this.orientation = orientation;
    this.notifyObservers();
  }

  public static getInstance(): SplitContext {
    if (!SplitContext.instance) {
      SplitContext.instance = new SplitContext();
    }
    return SplitContext.instance;
  }

  public dispatchToBackground(eventType: SplitEventType) {
    if (!this.dispatchNextEvent) {
      console.warn("Warning: Skipping dispatch of event type " + eventType + " to background to prevent feedback loop");
      return; // Prevent dispatching if the flag is set to false (to avoid feedback loops)
    }

    let event: SplitEvent;
    switch (eventType) {
      case "UPDATE_URLS":
        event = new UpdateUrlsSplitEvent(this.leftUrl, this.rightUrl);
        break;
      default:
        console.warn(`Warning: Unknown split event type "${eventType}"`);
        return;
    }

    // Send the event to the background script
    browser.runtime.sendMessage({ sender: "split", event });
    console.info("[SplitContext] > Dispatched event to background:", event);
  }

  public updateFromBackgroundEvent(event: BackgroundEvent) {
    this.dispatchNextEvent = false; // Prevent dispatching an event back to the background in response to this update

    console.info("[SplitContext] > Received event of type " + event.type + " from background: ", event);

    // Update context properties based on the event type
    switch (event.type) {
      case "INIT_EXTENSION":
        this.settings = (event as InitExtensionBackgroundEvent).settings;
        break;
      case "UPDATE_LEFT_URL":
        this.updateUrl("left", (event as UpdateLeftUrlBackgroundEvent).leftUrl);
        break;
      case "UPDATE_RIGHT_URL":
        this.updateUrl("right", (event as UpdateRightUrlBackgroundEvent).rightUrl);
        break;
      case "UPDATE_ORIENTATION":
        this.updateOrientation((event as UpdateOrientationBackgroundEvent).orientation);
        break;
      case "THEME_COLORS":
        this.themeColors = (event as UpdateThemeColorsBackgroundEvent).themeColors;
        break;
      default:
        break;
    }

    console.info("[SplitContext] > Updated context based on background event. Current context:", this);

    this.dispatchNextEvent = true; // Re-enable dispatching of events to the background after updating context based on the received event
  }
}
