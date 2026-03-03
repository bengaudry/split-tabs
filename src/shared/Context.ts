import { ThemeColors } from "../app/background/types";
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

    const storedSettings = Object.keys(localStorage).filter(
      (key) => key.startsWith("split-tabs-") && key.endsWith("-setting")
    );
    const parsedSettings = new Map<string, any>();
    storedSettings.forEach((settingKey) => {
      const settingName = settingKey.replace("split-tabs-", "").replace("-setting", "");
      const settingValue = localStorage.getItem(settingKey);
      if (settingValue === "true") {
        parsedSettings.set(settingName, true);
      } else if (settingValue === "false") {
        parsedSettings.set(settingName, false);
      } else if (!isNaN(Number(settingValue))) {
        parsedSettings.set(settingName, Number(settingValue));
      } else {
        parsedSettings.set(settingName, settingValue || "");
      }
    });

    this.settings = {
      "close-tab-before-opening": parsedSettings.get("close-tab-before-opening") || false,
      "match-with-firefox-theme": parsedSettings.get("match-with-firefox-theme") || true
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
