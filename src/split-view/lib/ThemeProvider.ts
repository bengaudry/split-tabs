import { changeCssVariableValue, getRgbValuesFromBackgroundColor, getUserScheme } from "../../utils/colors";

export type SplitViewTheme = {
  defaultBackgroundColor: string;
  defaultInputBackgroundColor: string;
  defaultPrimaryTextColor: string;
  defaultSecondaryTextColor: string;
  defaultBorderColor: string;

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

  leftViewBackgroundColor: "--left-pane-background-color",
  leftViewTextColor: "--left-pane-text-color",

  rightViewBackgroundColor: "--right-pane-background-color",
  rightViewTextColor: "--right-pane-text-color"
};

const DEFAULT_LIGHT_THEME: SplitViewTheme = {
  defaultBackgroundColor: "234, 234, 237",
  defaultInputBackgroundColor: "222, 222, 225",
  defaultPrimaryTextColor: "0, 0, 0",
  defaultSecondaryTextColor: "128, 128, 128",
  defaultBorderColor: "200, 200, 200"
};

const DEFAULT_DARK_THEME: SplitViewTheme = {
  defaultBackgroundColor: "28, 27, 34",
  defaultInputBackgroundColor: "20, 19, 24",
  defaultPrimaryTextColor: "255, 255, 255",
  defaultSecondaryTextColor: "128, 128, 128",
  defaultBorderColor: "75, 75, 75"
};

export class ThemeProvider {
  private theme: SplitViewTheme;

  constructor() {
    this.theme = { ...this.getDefaultTheme() };
    this.setTheme(this.theme);

    // Listen for system theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      this.setTheme(this.getDefaultTheme());
      browser.runtime.sendMessage({ type: "GET_THEME" });
    });
  }

  /** Get the default theme based on the user's system preference */
  private getDefaultTheme(): SplitViewTheme {
    console.log("dark :", DEFAULT_DARK_THEME);
    console.log("light :", DEFAULT_LIGHT_THEME);
    return getUserScheme() === "dark" ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  }

  /** Resets the theme to the default one */
  public resetThemeToDefault() {
    console.info("Resetting theme to default values");
    const defaultTheme = this.getDefaultTheme();
    console.log(defaultTheme);
    this.setTheme(defaultTheme);
    this.setThemeProperties([
      ["leftViewBackgroundColor", defaultTheme.defaultBackgroundColor],
      ["leftViewTextColor", defaultTheme.defaultPrimaryTextColor],
      ["rightViewBackgroundColor", defaultTheme.defaultBackgroundColor],
      ["rightViewTextColor", defaultTheme.defaultPrimaryTextColor]
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
    // Create a shallow copy to avoid mutating the original theme object
    this.theme = { ...theme };

    for (const key of Object.keys(theme)) {
      if (!Object.keys(THEME_PROPERTY_NAMES).includes(key)) continue;
      const value = theme[key as keyof SplitViewTheme];
      this.setThemeProperties([[key as keyof SplitViewTheme, value]]);
    }
  }

  /** Sets multiple theme properties at once */
  public setThemeProperties<K extends keyof SplitViewTheme>(properties: Array<[K, any]>) {
    for (const [key, value] of properties) {
      if (!value) continue;

      let cssValue: string | null = null;

      console.log(`[ThemeProvider] Setting theme property ${key} to value:`, value, typeof value);

      // If the value is a string representing a color, convert it to rgb values
      if (typeof value === "string") {
        cssValue = getRgbValuesFromBackgroundColor(value);
      } else if (Array.isArray(value)) {
        // In some versions, rgb values are put in an array ([r, g, b])
        cssValue = value.join(", ");
      }

      if (!cssValue) continue;

      if ("defaultPrimaryTextColor" === key) {
        browser.runtime.sendMessage({
          type: "UPDATE_ICON_COLOR",
          color: `rgb(${cssValue})`
        });
      }

      this.theme[key] = cssValue;
      changeCssVariableValue(this.matchThemePropertyToCssVariable(key), cssValue);
    }
  }
}
