import { Observer } from "shared/observability/Observer";
import { browserThemeColorToRgbValues, changeCssVariableValue } from "shared/colors/utils";
import { knownThemesColors } from "shared/themes/knownThemesColors";
import { getPrefferedUserScheme } from "shared/themes/utils";
import { SplitContext } from "./SplitContext";

export type SplitViewTheme = {
  defaultBackgroundColor: string;
  defaultInputBackgroundColor: string;
  defaultPrimaryTextColor: string;
  defaultSecondaryTextColor: string;
  defaultBorderColor: string;
  defaultActiveBorderColor: string;

  leftViewBackgroundColor?: string;
  leftViewTextColor?: string;

  rightViewBackgroundColor?: string;
  rightViewTextColor?: string;
};

const THEME_PROPERTY_NAMES = {
  defaultBackgroundColor: "--main-background-color",
  defaultInputBackgroundColor: "--input-background-color",
  defaultPrimaryTextColor: "--primary-text-color",
  defaultSecondaryTextColor: "--secondary-text-color",
  defaultBorderColor: "--border-color",
  defaultActiveBorderColor: "--active-border-color",

  leftViewBackgroundColor: "--left-pane-background-color",
  leftViewTextColor: "--left-pane-text-color",

  rightViewBackgroundColor: "--right-pane-background-color",
  rightViewTextColor: "--right-pane-text-color"
} as const;

export class ThemeProvider implements Observer<SplitContext> {
  private theme: SplitViewTheme;

  constructor() {
    SplitContext.getInstance().addObserver(this);
    this.theme = { ...this.getDefaultTheme() };
    this.setTheme(this.theme);

    // Listen for system theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      this.setTheme(this.getDefaultTheme());
      browser.runtime.sendMessage({ type: "REQUEST_UPDATE_THEME" });
    });
  }

  public static themeColorsToSplitViewThemeColors(themeColors: Record<string, string>): SplitViewTheme {
    return {
      defaultBackgroundColor: themeColors.backgroundColor,
      defaultInputBackgroundColor: themeColors.inputBackground,
      defaultPrimaryTextColor: themeColors.textColor,
      defaultSecondaryTextColor: themeColors.secondaryTextColor,
      defaultBorderColor: themeColors.borderColor,
      defaultActiveBorderColor: themeColors.activeBorderColor
    };
  }

  /** Get the default theme based on the user's system preference */
  private getDefaultTheme(): SplitViewTheme {
    return getPrefferedUserScheme() === "dark"
      ? ThemeProvider.themeColorsToSplitViewThemeColors(knownThemesColors.Dark)
      : ThemeProvider.themeColorsToSplitViewThemeColors(knownThemesColors.Light);
  }

  /** Resets the theme to the default one */
  public resetThemeToDefault() {
    const defaultTheme = this.getDefaultTheme();
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

      // If the value is a string representing a color, convert it to rgb values
      if (typeof value === "string") {
        const rgbValues = browserThemeColorToRgbValues(value);
        if (rgbValues) {
          cssValue = rgbValues.toString();
        }
      } else if (Array.isArray(value)) {
        // In some versions, rgb values are put in an array ([r, g, b])
        cssValue = value.join(", ");
      }

      if (!cssValue) continue;

      this.theme[key] = cssValue;
      changeCssVariableValue(this.matchThemePropertyToCssVariable(key), cssValue);
    }
  }

  public update(o: SplitContext): void {
    const themeColors = o.getThemeColors();
    this.setThemeProperties([
      ["defaultBackgroundColor", themeColors.backgroundColor],
      ["defaultInputBackgroundColor", themeColors.inputBackground],
      ["defaultPrimaryTextColor", themeColors.textColor],
      ["defaultSecondaryTextColor", themeColors.secondaryTextColor],
      ["defaultBorderColor", themeColors.borderColor],
      ["defaultActiveBorderColor", themeColors.activeBorderColor]
    ]);
  }
}
