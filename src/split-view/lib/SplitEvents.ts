export const SPLIT_EVENT_TYPES = [
  "FETCH_TABS",
  "UPDATE_URLS",
  "CLOSE_SPLIT",
  "UPDATE_SETTING",
  "STOP_SHOWING_RATING_POPUP",
  "OPEN_SETTINGS",
  "OPEN_EXTERNAL_URL",
  "GET_THEME"
] as const;

export type SplitEventType = (typeof SPLIT_EVENT_TYPES)[number];

export abstract class SplitEvent {
  type: SplitEventType;

  constructor(type: SplitEventType) {
    this.type = type;
  }
}

export class UpdateUrlsSplitEvent extends SplitEvent {
  leftUrl: string | null;
  rightUrl: string | null;

  constructor(leftUrl: string | null, rightUrl: string | null) {
    super("UPDATE_URLS");
    this.leftUrl = leftUrl;
    this.rightUrl = rightUrl;
  }
}

export class UpdateSettingSplitEvent extends SplitEvent {
  key: string;
  value: string | number | boolean;

  constructor(key: string, value: string | number | boolean) {
    super("UPDATE_SETTING");
    this.key = key;
    this.value = value;
  }
}
