export const SPLIT_EVENT_TYPES = [
  "UPDATE_URLS",
  "REQUEST_FETCH_TABS",
  "REQUEST_CLOSE_SPLIT",
  "REQUEST_OPEN_EXTERNAL_URL",
  "REQUEST_UPDATE_THEME"
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
