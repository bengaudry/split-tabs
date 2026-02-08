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
  const a = parseInt(tab[3] ?? "1");
  const inverted = `${255 - r}, ${255 - g}, ${255 - b}, ${a}`;

  return inverted;
}

/** Transforms a color that comes from a background-color css property to
 *  rgb values in a string (black -> "0, 0, 0") */
export function getRgbValuesFromBackgroundColor(bg: string | null) {
  if (!bg) return `0, 0, 0`;
  console.log("1", bg);

  bg = bg.replaceAll(" ", "").trim();
  console.log("2", bg);

  if (bg.startsWith("rgb")) {
    const data = bg.replaceAll("rgba", "").replaceAll("rgb", "").replaceAll("(", "").replaceAll(")", "").split(",");
    console.log("3", data);
    return `${data[0] ?? 0}, ${data[1] ?? 0}, ${data[2] ?? 0}`; // rgba(a, b, c, d) => a, b, c, d
  }

  const rgbRegex = /^[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]\s?,[0-2]?[0-9]?[0-9]$/;

  if (rgbRegex.test(bg)) {
    return bg;
  }
  console.log("4", hexToRgba(bg));
  return hexToRgba(bg) ?? `0, 0, 0`;
}

/** Changes the value of a css variable */
export function changeCssVariableValue(variableName: string, value: string) {
  console.log(`[colors.ts] Changing CSS variable ${variableName} to value:`, value);
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
