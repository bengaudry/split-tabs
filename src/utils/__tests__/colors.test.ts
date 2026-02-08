import { it, describe, expect } from "vitest";
import { hexToRgba } from "../colors";

describe("colors", () => {
  describe("hexToRgba", () => {
    it("should return null for unexpected values", () => {
      // @ts-expect-error
      expect(hexToRgba(undefined)).toBe(null);
      // @ts-expect-error
      expect(hexToRgba(null)).toBe(null);
    });

    it("should convert hex to rgba", () => {
      expect(hexToRgba("#ffffff")).toBe("255, 255, 255, 1");
      expect(hexToRgba("#000000")).toBe("0, 0, 0, 1");
      expect(hexToRgba("#ff0000")).toBe("255, 0, 0, 1");
    });
  });
});
