export const SPLIT_EVENT_TYPES = [
  "UPDATE_LEFT_URL",
  "UPDATE_RIGHT_URL",
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

export class UpdateLeftUrlSplitEvent extends SplitEvent {
  leftUrl: string | null;

  constructor(leftUrl: string | null) {
    super("UPDATE_LEFT_URL");
    this.leftUrl = leftUrl;
  }
}

export class UpdateRightUrlSplitEvent extends SplitEvent {
  rightUrl: string | null;

  constructor(rightUrl: string | null) {
    super("UPDATE_RIGHT_URL");
    this.rightUrl = rightUrl;
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
