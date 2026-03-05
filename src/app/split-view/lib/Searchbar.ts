import { Side } from "shared/types";
import { addProtocolToUrl, filterIncorrectTabs, isUrlLike } from "shared/utils/urls";
import { SplitContext } from "./SplitContext";
import { View } from "./View";

export class Searchbar {
  private static instance: Searchbar;

  private isCloseForbidden = false; // forbid close when one of the view is empty
  private initialValue: string | null = null; // used to know if the value has changed since the opening

  // When clicking on toolbar links (or close button), the input naturally blurs.
  // We want to ignore the blur handler in that specific case to avoid triggering a search.
  private suppressNextBlur = false;

  public static getInstance(): Searchbar {
    if (!Searchbar.instance) {
      Searchbar.instance = new Searchbar();
    }
    return Searchbar.instance;
  }

  /**
   * Adds all events related to the search bar
   */
  private constructor() {
    const searchbarInput = this.getSearchbarInputRef();
    if (!searchbarInput) return;

    // Mark that the next blur should be ignored when user clicks inside the toolbar area
    const wrapper = this.getSearchbarWrapperRef();
    wrapper?.addEventListener("pointerdown", (e) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt?.closest(".toolbar-links-container") || tgt?.closest("#searchbar-close-trigger")) {
        this.suppressNextBlur = true;
      }
    });

    // Reset the suppression flag right after the click sequence completes
    document.addEventListener("pointerup", () => {
      setTimeout(() => (this.suppressNextBlur = false), 0);
    });

    // Change panes urls on input blurs or Enter key press
    searchbarInput.addEventListener("blur", (e: FocusEvent) => {
      const input = e.target as HTMLInputElement | null;
      const value = input?.value ?? "";

      // If focus is moving to a toolbar link or close button, ignore this blur
      const next = (e.relatedTarget as HTMLElement | null) ?? null;
      if (
        this.suppressNextBlur ||
        next?.closest(".toolbar-links-container") ||
        next?.closest("#searchbar-close-trigger")
      ) {
        return;
      }
      // If the value is empty or unchanged it might be because the user
      // clicked on a link, so let the click event handle it
      if (value === "" || value === this.initialValue) {
        e.stopPropagation();
        return;
      }

      this.handleSearchBarEndInput(value);
    });

    searchbarInput.addEventListener("keyup", (e: KeyboardEvent) => {
      if ("Enter" === e.key) {
        const input = e.target as HTMLInputElement | null;
        this.handleSearchBarEndInput(input?.value ?? "");
      }
    });

    // Close searchbar on pressing escape or clicking away
    document.getElementById("searchbar-close-trigger")?.addEventListener("click", () => {
      this.close();
    });

    document.addEventListener("keyup", (e) => {
      if ("Escape" === e.code) this.close();
    });
  }

  public forbidClose() {
    this.isCloseForbidden = true;
  }

  public enableClose() {
    this.isCloseForbidden = false;
  }

  /**
   * Make a query with the search engine or open a url in the split-view
   * when the search bar receives validation (Enter key or blur)
   */
  private handleSearchBarEndInput(query: string) {
    if (query === "") return; // avoid setting a new tab if the user has just discarded the searchbar
    const searchbarInput = this.getSearchbarInputRef();

    let url;
    if (isUrlLike(query)) url = addProtocolToUrl(query);
    else {
      const googleUrl = new URL("https://www.google.com/search");
      googleUrl.searchParams.set("q", query);
      url = googleUrl.toString();
    }
    if (searchbarInput) searchbarInput.value = "";
    View.loadUrl(SplitContext.getInstance().getActiveSide(), url);
    this.enableClose();
  }

  private getSearchbarWrapperRef() {
    return document.querySelector<HTMLDivElement>("#searchbar-wrapper");
  }

  private getSearchbarInputRef() {
    return document.querySelector<HTMLInputElement>("#searchbar-url-input");
  }

  /** Close the searchbar */
  public close() {
    if (this.isCloseForbidden) return;

    const searchbarWrapper = this.getSearchbarWrapperRef();
    if (!searchbarWrapper) return;

    const searchbarInput = this.getSearchbarInputRef();
    if (!searchbarInput) return;

    this.initialValue = null;

    searchbarWrapper.setAttribute("data-expanded", "false");
    searchbarInput.value = "";
  }

  /** Open the searchbar and set the default URL if provided */
  public open({ splitInstance, defaultUrl }: { splitInstance?: View; defaultUrl?: string | null }) {
    const searchbarWrapper = this.getSearchbarWrapperRef();
    const searchbarInput = this.getSearchbarInputRef();

    if (!searchbarWrapper || !searchbarInput) return;

    if (splitInstance) this.populateToolbarLinkContainer(splitInstance);

    this.initialValue = defaultUrl || null;

    searchbarWrapper.setAttribute("data-expanded", "true");
    searchbarInput.value = defaultUrl || "";
    searchbarInput.focus();
    searchbarInput.select();
  }

  /** Fetches browser opened tabs and creates links to them
   *  inside the toolbar
   */
  public async populateToolbarLinkContainer(splitInstance: View) {
    const searchbarWrapper = this.getSearchbarWrapperRef();
    if (!searchbarWrapper) return;

    try {
      const response = await browser.runtime.sendMessage({
        type: "REQUEST_FETCH_TABS"
      });

      if (response.type !== "TABS_DATA") return;

      const toolbarLinksContainer = searchbarWrapper.querySelector<HTMLUListElement>(".toolbar-links-container");
      if (toolbarLinksContainer) toolbarLinksContainer.innerHTML = ""; // Clear existing links

      const tabs = filterIncorrectTabs(response.tabs).sort((a, b) => a.lastAccessed - b.lastAccessed);

      let i = 1;
      for (const tab of tabs) {
        const button = document.createElement("button");
        button.id = `toolbar-link-${i++}`;
        button.className = "toolbar-tab-link";

        const img = document.createElement("img");
        img.src = tab.favIconUrl;
        const txtSpan = document.createElement("span");
        txtSpan.textContent = tab.title;

        button.appendChild(img);
        button.appendChild(txtSpan);

        button.addEventListener("click", () => {
          this.enableClose();
          splitInstance.loadUrl(tab.url);
        });
        if (toolbarLinksContainer) toolbarLinksContainer.appendChild(button);
      }
    } catch (err) {
      console.error(err);
    }
  }
}
