/**
 * Utility functions for colors manipulation and conversion.
 */

enum ColorType {
  word,
  hex,
  hexa, // hexadecimal with alpha channel
  rgb,
  rgba,
  rgbValues,
  rgbaValues,
  unknown
}

/** Converts a hexadecimal color code to a rgb string */
export function hexToRgba(hex: string) {
  if (!hex) return null;
  if (hex === "white") return "255, 255, 255, 1";
  if (hex === "black") return "0, 0, 0, 1";
  if (hex === "transparent") return "0, 0, 0, 0";

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // return {r, g, b}
  return `${r}, ${g}, ${b}, 1`;
}

/** Returns the inverted rgb values of a color without changing alpha channel
 *  ("0, 0, 0, a" -> "255, 255, 255, a")
 * @param {string} rgb
 */
export function invertRgbValues(rgb: string) {
  const tab = rgb.replaceAll(" ", "").split(",");

  const r = parseInt(tab[0]);
  const g = parseInt(tab[1]);
  const b = parseInt(tab[2]);
  const a = parseFloat(tab[3] ?? "1");
  const inverted = `${255 - r}, ${255 - g}, ${255 - b}, ${a}`;

  return inverted;
}

/** Transforms a color that comes from a background-color css property to
 *  rgb values in a string (black -> "0, 0, 0") */
export function getRgbValuesFromBackgroundColor(bg: string | null) {
  if (!bg) return `0, 0, 0`;

  bg = bg.replaceAll(" ", "").trim();

  if (bg.startsWith("rgb")) {
    const data = bg.replaceAll("rgba", "").replaceAll("rgb", "").replaceAll("(", "").replaceAll(")", "").split(",");
    return `${data[0] ?? 0}, ${data[1] ?? 0}, ${data[2] ?? 0}`; // rgba(a, b, c, d) => a, b, c, d
  }

  const rgbRegex = /^[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]$/;

  if (rgbRegex.test(bg)) {
    return bg;
  }
  return hexToRgba(bg) ?? `0, 0, 0`;
}

/**
 * Checks if a color string is in the format of "r, g, b" where r, g and b are integers between 0 and 255
 * @param color The color string to check
 * @returns true if the color string is in the correct format, false otherwise
 * @example
 * isRgbColorString("255, 255, 255") // true
 */
export function isRgbValuesColorString(color: string): boolean {
  const rgbRegex = /^\s*[0-2]?[0-9]?[0-9]\s*,\s*[0-2]?[0-9]?[0-9]\s*,\s*[0-2]?[0-9]?[0-9]\s*$/;
  return rgbRegex.test(color);
}

/**
 * Checks if a color string is in the format of "r, g, b, a" where r, g and b are integers between 0 and 255
 * and a is a float between 0 and 1
 * @param color The color string to check
 * @returns true if the color string is in the correct format, false otherwise
 * @example
 * isRgbaColorString("255, 255, 255, 1") // true
 */
export function isRgbaValuesColorString(color: string): boolean {
  const rgbaRegex = /^\s*[0-2]?[0-9]?[0-9]\s*,\s*[0-2]?[0-9]?[0-9]\s*,\s*[0-2]?[0-9]?[0-9]\s*,\s*\d+\.?\d*\s*$/;
  return rgbaRegex.test(color);
}

/**
 * Checks if a color string is a hexadecimal color code in the format of "#RRGGBB" or "#RGB"
 * @param color The color string to check
 * @returns true if the color string is in the correct format, false otherwise
 * @example
 * isHexColorString("#ffffff") // true
 * isHexColorString("#fff") // true
 * isHexColorString("ffffff") // false
 * isHexColorString("#ggg") // false
 */
export function isHexColorString(color: string): boolean {
  const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
  return hexRegex.test(color);
}

/**
 * Checks if a color string is a hexadecimal color code in the format of "#RRGGBBAA" or "#RGBA"
 * @param color The color string to check
 * @returns true if the color string is in the correct format, false otherwise
 * @example
 * isHexaColorString("#ffffffff") // true
 * isHexaColorString("#ffff") // true
 * isHexaColorString("ffffffff") // false
 * isHexaColorString("#gggg") // false
 */
export function isHexaColorString(color: string): boolean {
  const hexaRegex = /^#(?:[0-9a-fA-F]{4}){1,2}$/;
  return hexaRegex.test(color);
}

/**
 * Determines the type of a given color string.
 * @param color The color string to check
 * @returns The ColorType of the color string, or null if the input is undefined, null, or an empty string
 * @example
 * getColorType("#ffffff") // ColorType.hex
 * getColorType("255, 255, 255") // ColorType.rgb
 * getColorType("255, 255, 255, 1") // ColorType.rgba
 */
export function getColorType(color: string | undefined | null): ColorType | null {
  if (color === undefined || color === null || color === "") return null;

  const clearedColor = color.trim().replaceAll(" ", "");

  if (isRgbValuesColorString(clearedColor)) return ColorType.rgbValues;
  if (isRgbaValuesColorString(clearedColor)) return ColorType.rgbaValues;
  if (isHexColorString(clearedColor)) return ColorType.hex;
  if (isHexaColorString(clearedColor)) return ColorType.hexa;

  return ColorType.unknown;
}

/** Changes the value of a css variable */
export function changeCssVariableValue(variableName: string, value: string) {
  const root = document.querySelector<HTMLElement>(":root");
  if (root) root.style.setProperty(variableName, value);
}

/** Returns the user's preferred color scheme */
export function getUserScheme(): "dark" | "light" {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}
