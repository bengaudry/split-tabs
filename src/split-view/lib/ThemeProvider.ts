import { changeCssVariableValue, getRgbValuesFromBackgroundColor, getUserScheme } from "../../utils/colors";

export type SplitViewTheme = {
  defaultBackgroundColor: string;
  defaultInputBackgroundColor: string;
  defaultPrimaryTextColor: string;
  defaultSecondaryTextColor: string;
  defaultBorderColor: string;
  defaultShadowColor: string;

  leftViewBackgroundColor?: string;
  leftViewTextColor?: string;

  rightViewBackgroundColor?: string;
  rightViewTextColor?: string;
};

const THEME_PROPERTY_NAMES: Record<keyof SplitViewTheme, string> = {
  defaultBackgroundColor: "--main-background-color",
  defaultInputBackgroundColor: "--input-background-color",
  defaultPrimaryTextColor: "--primary-text-color",
  defaultSecondaryTextColor: "--secondary-text-color",
  defaultBorderColor: "--border-color",
  defaultShadowColor: "--shadow-color",

  leftViewBackgroundColor: "--left-pane-background-color",
  leftViewTextColor: "--left-pane-text-color",

  rightViewBackgroundColor: "--right-pane-background-color",
  rightViewTextColor: "--right-pane-text-color",
};

const DEFAULT_LIGHT_THEME: SplitViewTheme = {
  defaultBackgroundColor: "255, 255, 255",
  defaultInputBackgroundColor: "255, 255, 255",
  defaultPrimaryTextColor: "0, 0, 0",
  defaultSecondaryTextColor: "128, 128, 128",
  defaultBorderColor: "200, 200, 200",
  defaultShadowColor: "255, 255, 255",
};

const DEFAULT_DARK_THEME: SplitViewTheme = {
  defaultBackgroundColor: "28, 27, 34",
  defaultInputBackgroundColor: "48, 48, 48",
  defaultPrimaryTextColor: "255, 255, 255",
  defaultSecondaryTextColor: "128, 128, 128",
  defaultBorderColor: "75, 75, 75",
  defaultShadowColor: "12, 12, 12",
};

export class ThemeProvider {
  private theme: SplitViewTheme = DEFAULT_LIGHT_THEME;

  constructor() {
    this.setTheme(this.getDefaultTheme());

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        this.setTheme(this.getDefaultTheme());
        browser.runtime.sendMessage({ type: "GET_THEME" });
      });
  }

  /** Get the default theme based on the user's system preference */
  private getDefaultTheme(): SplitViewTheme {
    return getUserScheme() === "dark"
      ? DEFAULT_DARK_THEME
      : DEFAULT_LIGHT_THEME;
  }

  /** Resets the theme to the default one */
  public resetThemeToDefault() {
    const defaultTheme = this.getDefaultTheme();
    this.setTheme(defaultTheme);
    this.setThemeProperties([
      ["leftViewBackgroundColor", defaultTheme.defaultBackgroundColor],
      ["leftViewTextColor", defaultTheme.defaultPrimaryTextColor],
      ["rightViewBackgroundColor", defaultTheme.defaultBackgroundColor],
      ["rightViewTextColor", defaultTheme.defaultPrimaryTextColor],
    ]);
  }

  /** Matches a theme property key to its corresponding CSS variable name */
  private matchThemePropertyToCssVariable(key: keyof SplitViewTheme): string {
    return THEME_PROPERTY_NAMES[key];
  }

  /** Returns the current theme */
  public getTheme(): SplitViewTheme {
    return this.theme;
  }

  /** Sets the theme */
  public setTheme(theme: SplitViewTheme) {
    this.theme = theme;

    for (const key of Object.keys(theme) as (keyof SplitViewTheme)[]) {
      const value = theme[key];
      // @ts-expect-error
      this.setThemeProperties([key, value]);
    }
  }

  /** Sets multiple theme properties at once */
  public setThemeProperties<K extends keyof SplitViewTheme>(
    properties: Array<[K, any]>
  ) {
    for (const [key, value] of properties) {
      if (!value) continue;

      let cssValue: string | null = null;

      // If the value is a string representing a color, convert it to rgb values
      if (typeof value === "string") {
        cssValue = getRgbValuesFromBackgroundColor(value);
      }

      // In some versions, rgb values are put in an array ([r, g, b])
      if (Array.isArray(value)) {
        cssValue = value.join(", ");
      }

      if (!cssValue) continue;

      if ("defaultPrimaryTextColor" === key) {
        browser.runtime.sendMessage({
          type: "UPDATE_ICON_COLOR",
          color: `rgb(${cssValue})`,
        })
      }

      this.theme[key] = cssValue;
      changeCssVariableValue(this.matchThemePropertyToCssVariable(key), cssValue);
    }
  }
}
