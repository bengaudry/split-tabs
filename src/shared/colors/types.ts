export enum ColorType {
  word, // color name (e.g. "red", "blue", "black")
  hex, // hexadecimal color code
  hexa, // hexadecimal with alpha channel
  rgbFunction, // rgb() function format
  rgbaFunction, // rgba() function format
  rgbValues, // "r, g, b" format
  rgbaValues, // "r, g, b, a" format
  rgbArray, // [r, g, b] format
  rgbaArray, // [r, g, b, a] format,
  hslFunction, // hsl() function format
  unknown
}
