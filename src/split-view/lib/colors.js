/** 
 * Converts a hexadecimal color code to a rgb string 
 * @param {string} hex 
 */
export function hexToRgba (hex) {
  if (!hex) return null;
  if (hex === "white") return "255, 255, 255, 1";
  if (hex === "black") return "0, 0, 0, 1";
  if (hex === "transparent") return "0, 0, 0, 0";

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // return {r, g, b}
  return `${r}, ${g}, ${b}, 1`;
};

/** Returns the inverted rgb values of a color without changing alpha channel
 *  ("0, 0, 0, a" -> "255, 255, 255, a") 
 * @param {string} rgb 
 */
export function invertRgbValues(rgb) {
  // turns "255, 255, 255" into "0, 0, 0"
  const tab = rgb.replaceAll(" ", "").split(",");
  const r = tab[0];
  const g = tab[1];
  const b = tab[2];
  const a = tab[3] || 1;
  return `${255 - r}, ${255 - g}, ${255 - b}, ${a}`;
}

/** Transforms a color that comes from a background-color css property to
 *  rgb values in a string (black -> "0, 0, 0, 0")
 * @param {string} bg 
 */
export function getRgbValuesFromBackgroundColor(bg) {
  if (bg === null || bg === undefined) return null;

  bg = bg.replaceAll(" ", "");
  if (bg.startsWith("rgba")) {
    return bg.replaceAll("rgba", "").replaceAll("(", "").replaceAll(")", ""); // rgba(a, b, c, d) => a, b, c, d
  } else if (bg.startsWith("rgb")) {
    return `${bg
      .replaceAll("rgb", "")
      .replaceAll("(", "")
      .replaceAll(")", "")},1`; // rgb(a, b, c) => a, b, c, 1
  }
  return hexToRgba(bg);
}

/** Changes the value of a css variable
 * @param {string} variableName 
 * @param {string} value 
 */
export function changeCssVariableValue(variableName, value) {
  if (value === undefined || value === null) return;
  const root = document.querySelector(":root");
  root.style.setProperty(variableName, value);
}
