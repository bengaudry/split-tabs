export type Branded<K, T> = K & { __brand: T };

export type Side = "left" | "right" | "top" | "bottom";
export type Orientation = "horizontal" | "vertical";

export type ThemeColor = browser._manifest.ThemeColor;
