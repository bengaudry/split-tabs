import { ThemeColors } from "./types";

export const BACKGROUND_EVENT_TYPES = [
  "LOAD_URLS",
  "UPDATE_LEFT_URL",
  "UPDATE_RIGHT_URL",
  "UPDATE_ORIENTATION",
  "UPDATE_SETTING",
  "THEME_COLORS",
  "INIT_EXTENSION",
  "TABS_DATA"
] as const;

export type BackgroundEventType = (typeof BACKGROUND_EVENT_TYPES)[number];

export abstract class BackgroundEvent {
  type: BackgroundEventType;

  constructor(type: BackgroundEventType) {
    this.type = type;
  }
}

export class UpdateLeftUrlBackgroundEvent extends BackgroundEvent {
  leftUrl: string | null;

  constructor(leftUrl: string | null) {
    super("UPDATE_LEFT_URL");
    this.leftUrl = leftUrl;
  }
}

export class UpdateRightUrlBackgroundEvent extends BackgroundEvent {
  rightUrl: string | null;

  constructor(rightUrl: string | null) {
    super("UPDATE_RIGHT_URL");
    this.rightUrl = rightUrl;
  }
}

export class UpdateOrientationBackgroundEvent extends BackgroundEvent {
  orientation: "horizontal" | "vertical";

  constructor(orientation: "horizontal" | "vertical") {
    super("UPDATE_ORIENTATION");
    this.orientation = orientation;
  }
}

export class UpdateThemeColorsBackgroundEvent extends BackgroundEvent {
  themeColors: ThemeColors;

  constructor(themeColors: ThemeColors) {
    super("THEME_COLORS");
    this.themeColors = themeColors;
  }
}

export class InitExtensionBackgroundEvent extends BackgroundEvent {
  settings: { [key: string]: string | number | boolean };

  constructor(settings: { [key: string]: string | number | boolean }) {
    super("INIT_EXTENSION");
    this.settings = settings;
  }
}
