import { cssColorsNames } from "./cssColorsNames";
import { RgbColor } from "./RgbColor";
import { ColorType } from "./types";
import {
  hexToRgbColor,
  hexaToRgbColor,
  rgbFunctionToRgbColor,
  rgbaFunctionToRgbColor,
  rgbValuesToRgbColor,
  rgbaValuesToRgbColor,
  rgbArrayToRgbColor,
  rgbaArrayToRgbColor
} from "./converters";
import {
  isRgbValuesColorString,
  isRgbaValuesColorString,
  isHexColorString,
  isHexaColorString,
  isNamedColor
} from "./verifiers";

/** Returns the inverted rgb values of a color without changing alpha channel
 *  ("0, 0, 0, a" -> "255, 255, 255, a")
 */
export function invertRgbValues(color: RgbColor): RgbColor {
  const { r, g, b, a } = color;

  return new RgbColor(255 - r, 255 - g, 255 - b, a);
}

/**
 * Determines the type of a given color string.
 * @param color The color string to check
 * @returns The ColorType of the color string
 * @example
 * getColorType("#ffffff") // ColorType.hex
 * getColorType("255, 255, 255") // ColorType.rgbValues
 * getColorType("255, 255, 255, 1") // ColorType.rgbaValues
 */
export function getColorType(color: any): ColorType {
  if (Array.isArray(color)) {
    if (color.length === 3) return ColorType.rgbArray;
    if (color.length === 4) return ColorType.rgbaArray;
  }

  if (typeof color === "string") {
    const clearedColor = color.trim().replaceAll(" ", "");
    if (isHexColorString(clearedColor)) return ColorType.hex;
    if (isHexaColorString(clearedColor)) return ColorType.hexa;
    if (isRgbValuesColorString(clearedColor)) return ColorType.rgbValues;
    if (isRgbaValuesColorString(clearedColor)) return ColorType.rgbaValues;

    if (isNamedColor(clearedColor)) return ColorType.word;
  }

  return ColorType.unknown;
}

/**
 * Transforms a color that comes from a background-color css property to its rgb values.
 * It supports all color formats (named colors, hex, hexa, rgb() and rgba() functions, "r, g, b"
 * and "r, g, b, a" formats and rgb and rgba arrays).
 * @param color The color to transform (can be in any format supported by getColorType function)
 * @returns The rgb values of the color or null if the color format is not supported or if the color is invalid
 */
export function browserThemeColorToRgbValues(color: any): RgbColor | null {
  const colorType = getColorType(color);

  switch (colorType) {
    case ColorType.word:
      return hexToRgbColor(cssColorsNames[color as keyof typeof cssColorsNames]);
    case ColorType.hex:
      return hexToRgbColor(color);
    case ColorType.hexa:
      return hexaToRgbColor(color);
    case ColorType.rgbFunction:
      return rgbFunctionToRgbColor(color);
    case ColorType.rgbaFunction:
      return rgbaFunctionToRgbColor(color);
    case ColorType.rgbArray:
      return rgbArrayToRgbColor(color);
    case ColorType.rgbaArray:
      return rgbaArrayToRgbColor(color);
    case ColorType.rgbValues:
      return rgbValuesToRgbColor(color);
    case ColorType.rgbaValues:
      return rgbaValuesToRgbColor(color);
    default:
      return null;
  }
}

/** Changes the value of a css variable */
export function changeCssVariableValue(variableName: string, value: string) {
  const root = document.querySelector<HTMLElement>(":root");
  if (root) root.style.setProperty(variableName, value);
}
