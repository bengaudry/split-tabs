import { cssColorsNames } from "./cssColorsNames";

export const rgbFunctionRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
export const rgbaFunctionRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+\.?\d*)\s*\)$/;

export const rgbValuesRegex = /^[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]$/;
export const rgbaValuesRegex = /^[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]\s?,\s*\d+\.?\d*$/;

export const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
export const hexaRegex = /^#(?:[0-9a-fA-F]{4}){1,2}$/;

export const hslRegex = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(?:,\s*(\d+\.?\d*)\s*)?\)$/;

/**
 * Checks if a color string is in the format of "r, g, b" where r, g and b are integers between 0 and 255
 * @param color The color string to check
 * @returns true if the color string is in the correct format, false otherwise
 * @example
 * isRgbColorString("255, 255, 255") // true
 */
export function isRgbValuesColorString(color: string): boolean {
  return rgbValuesRegex.test(color);
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
  return rgbaValuesRegex.test(color);
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
  return hexaRegex.test(color);
}

/**
 * Checks if a color string is a named color (e.g. "red", "blue", "black") by checking if it exists in the cssColorsNames object
 * @param color The color string to check
 * @returns true if the color string is a named color, false otherwise
 */
export function isNamedColor(color: string): color is keyof typeof cssColorsNames {
  return color.toLowerCase() in cssColorsNames;
}
