import { ThemeColors } from "../background/types";
import { Orientation } from "./types";

export abstract class Context {
  protected leftUrl: string | null;
  protected rightUrl: string | null;
  protected orientation: Orientation;
  protected themeColors: ThemeColors;
  protected settings: {
    [key: string]: string | number | boolean;
  };

  protected constructor() {
    this.leftUrl = null;
    this.rightUrl = null;
    this.orientation = "horizontal" as Orientation;
    this.themeColors = {};
    this.settings = {
      "close-tab-before-opening": true,
      "show-rating-popup": true,
      "match-with-firefox-theme": true
    };
  }

  public getLeftUrl(): string | null {
    return this.leftUrl;
  }

  public getRightUrl(): string | null {
    return this.rightUrl;
  }

  public getOrientation(): Orientation {
    return this.orientation;
  }

  public getSetting(key: string) {
    return this.settings[key];
  }
}
