import hslToRgbConverter from "hsl-to-rgb";
import { RgbColor } from "./RgbColor";
import { hslRegex, rgbaFunctionRegex, rgbaValuesRegex, rgbFunctionRegex, rgbValuesRegex } from "./verifiers";

/**
 * Converts a hexadecimal color code to a rgb string
 * @param hex The hexadecimal color code to convert (e.g. "#ff0000")
 */
export function hexToRgbColor(hex: string): RgbColor {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return new RgbColor(r, g, b, 1);
}

export function hexaToRgbColor(hexa: string): RgbColor {
  const r = parseInt(hexa.slice(1, 3), 16);
  const g = parseInt(hexa.slice(3, 5), 16);
  const b = parseInt(hexa.slice(5, 7), 16);
  const a = parseInt(hexa.slice(7, 9), 16) / 255;

  return new RgbColor(r, g, b, a);
}

export function rgbFunctionToRgbColor(rgbFunction: string): RgbColor | null {
  const match = rgbFunction.match(rgbFunctionRegex);

  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return new RgbColor(r, g, b, 1);
  }

  return null;
}

export function rgbaFunctionToRgbColor(rgbaFunction: string): RgbColor | null {
  const match = rgbaFunction.match(rgbaFunctionRegex);

  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = parseFloat(match[4]);
    return new RgbColor(r, g, b, a);
  }

  return null;
}

export function rgbValuesToRgbColor(rgbValues: string): RgbColor | null {
  const match = rgbValues.match(rgbValuesRegex);

  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return new RgbColor(r, g, b, 1);
  }

  return null;
}

export function rgbaValuesToRgbColor(rgbaValues: string): RgbColor | null {
  const match = rgbaValues.match(rgbaValuesRegex);

  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = parseFloat(match[4]);
    return new RgbColor(r, g, b, a);
  }

  return null;
}

export function rgbArrayToRgbColor(rgbArray: number[]): RgbColor | null {
  if (rgbArray.length === 3) {
    const [r, g, b] = rgbArray;
    return new RgbColor(r, g, b, 1);
  }
  return null;
}

export function rgbaArrayToRgbColor(rgbaArray: number[]): RgbColor | null {
  if (rgbaArray.length === 4) {
    const [r, g, b, a] = rgbaArray;
    return new RgbColor(r, g, b, a);
  }
  return null;
}

/**
 * Converts a hsl() function string to a RgbColor object
 * @param hslFunction The hsl() function string to convert (e.g. "hsl(120, 100%, 50%)")
 */
export function hslFunctionToRgbColor(hslFunction: string): RgbColor | null {
  const match = hslFunction.match(hslRegex);

  if (match) {
    const h = parseInt(match[1]);
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    const values = hslToRgbConverter(h, s, l);
    return new RgbColor(values[0], values[1], values[2]);
  }

  return null;
}
