import { changeCssVariableValue, getRgbValuesFromBackgroundColor, invertRgbValues } from "../../utils/colors";
import { MIN_VIEW_PERCENTAGE } from "../../utils/constants";
import { createCompositeFavicon } from "../../utils/favicon";
import { getUrlBase } from "../../utils/urls";
import { Searchbar } from "./Searchbar";

export class View {
  private static leftSplitInstance: View;
  private static rightSplitInstance: View;

  private static leftPaneIcon: string | null = null;
  private static rightPaneIcon: string | null = null;

  private url: string | null = null;
  private urlPreview: string | null = null;

  private size: number;
  private side: "left" | "right";

  private iframeRef: HTMLIFrameElement | null;
  private searchbarTrigger: HTMLButtonElement | null;
  private refreshBtn: HTMLButtonElement | null;
  private closeBtn: HTMLButtonElement | null;

  constructor(url: string | null, size: number, side: "left" | "right") {
    this.loadUrl(url);

    this.size = size;
    this.side = side;

    if (side === "left") View.leftSplitInstance = this;
    else View.rightSplitInstance = this;

    this.searchbarTrigger = document.querySelector(`#${side}-pane-shortened-url-btn`);
    this.iframeRef = document.querySelector(`#${side}-pane-iframe`);
    this.refreshBtn = document.querySelector(`#${side}-pane-refresh-btn`);
    this.closeBtn = document.querySelector(`#${side}-pane-close-split-btn`);

    // Events
    this.searchbarTrigger?.addEventListener("click", () => {
      Searchbar.setActiveSide(this.side);
      Searchbar.open({ splitInstance: this, defaultUrl: this.url });
    });

    this.refreshBtn?.addEventListener("click", () => {
      this.loadUrl(this.url);
    });

    this.closeBtn?.addEventListener("click", () => {
      browser.runtime.sendMessage({
        type: "CLOSE_SPLIT",
        keep: side === "left" ? "right" : "left"
      });
    });

    this.iframeRef?.addEventListener("load", () => {
      this.requestIframeData();
    });
  }

  /** Load a new URL into the specified side's split */
  public static loadUrl(side: "left" | "right", newUrl: string) {
    const splitInstance = side === "left" ? View.leftSplitInstance : View.rightSplitInstance;
    splitInstance.loadUrl(newUrl);
  }

  /** Load a new URL into this split's iframe */
  public loadUrl(newUrl: string | null | undefined): boolean {
    console.log(`[${this.side} Split] Loading URL: `, newUrl);
    if (!newUrl) return false;
    try {
      const urlObj = new URL(newUrl);

      this.url = newUrl;
      this.urlPreview = urlObj.hostname;
      if (this.searchbarTrigger) {
        this.searchbarTrigger.textContent = this.urlPreview;
      } else console.warn("No searchbar trigger found");

      if (this.iframeRef) this.iframeRef.src = this.url;
      else console.warn("No iframe reference found");
      this.requestIframeData();

      Searchbar.close();

      let updatedLeftUrl: string | null = null;
      let updatedRightUrl: string | null = null;

      if ("left" === this.side) updatedLeftUrl = this.url;
      if ("right" === this.side) updatedRightUrl = this.url;

      const msg = {
        type: "UPDATE_TABS",
        updatedLeftUrl,
        updatedRightUrl
      };

      console.log("Sending message to background: ", msg);

      browser.runtime.sendMessage(msg);
      return true;
    } catch (err) {
      // TODO -> Manage this error properly
      console.error(`[${this.side} Split] Error loading URL: `, err);
      return false;
    }
  }

  /**
   * Resize this split
   * @warning the other split must be resized accordingly by the caller
   */
  public updateSize(newSize: number): void {
    if (this.size < MIN_VIEW_PERCENTAGE || newSize > 100 - MIN_VIEW_PERCENTAGE) return;
    this.size = newSize;
    changeCssVariableValue(`--${this.side}-pane-view-percentage`, `${this.size}%`);
  }

  /**
   * Requests icon, colors from website when iframe src changes
   */
  private requestIframeData = () => {
    console.log(`[${this.side} Split] Requesting iframe data`);
    if (!this.iframeRef?.contentWindow || !this.iframeRef.src) return;
    this.iframeRef.contentWindow.postMessage({ type: "REQUEST_IFRAME_DATA" }, this.iframeRef.src);

    window.addEventListener("message", (e) => {
      if (!this.url) return;
      if (e.data || e.data.type !== "REQUEST_IFRAME_DATA_RESULTS") return;
      if (!getUrlBase(this.url).startsWith(e.origin)) return; // not for this side
      console.log(e);

      // reload to update url if changed & check if url is correct
      if (!e.data.backgroundColor) return;
      const rgbVal = getRgbValuesFromBackgroundColor(e.data.backgroundColor);

      changeCssVariableValue("--left-pane-background-color", rgbVal);
      changeCssVariableValue("--left-pane-text-color", invertRgbValues(rgbVal));

      if (e.data.icon) {
        if ("left" === this.side) View.leftPaneIcon = e.data.icon;
        else View.rightPaneIcon = e.data.icon;
        createCompositeFavicon(View.leftPaneIcon, View.rightPaneIcon);
      }
    });
  };
}
