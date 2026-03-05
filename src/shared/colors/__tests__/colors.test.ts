import { it, describe, expect } from "vitest";
import { hexToRgbColor } from "../converters";
import { isRgbValuesColorString, isRgbaValuesColorString } from "../verifiers";

describe("colors", () => {
  describe("isRgbValuesColorString", () => {
    it("should return true for valid rgb values color strings", () => {
      expect(isRgbValuesColorString("255, 255, 255")).toBe(true);
      expect(isRgbValuesColorString("0, 0, 0")).toBe(true);
      expect(isRgbValuesColorString("8, 96, 4")).toBe(true);
    });

    it("should not accept negative values", () => {
      expect(isRgbValuesColorString("-45, 12, 4")).toBe(false);
      expect(isRgbValuesColorString("1, 255, -0")).toBe(false);
    });

    it("should accept even weirdly spaced strings", () => {
      expect(isRgbValuesColorString("     46, 12   ,  255")).toBe(true);
    });

    it("should not accept values above 255", () => {
      expect(isRgbValuesColorString("273, 4, 13093")).toBe(false);
    });

    it("should not accept floating numbers", () => {
      expect(isRgbValuesColorString("12.6, 3, 2")).toBe(false);
      expect(isRgbValuesColorString("12, 3, 235,4")).toBe(false);
    });

    it("should not accept rgba values", () => {
      expect(isRgbValuesColorString("128, 128, 128, 1")).toBe(false);
    });
  });

  describe("isRgbaValuesColorString", () => {
    it("should return true for valid rgb values color strings", () => {
      expect(isRgbaValuesColorString("128, 128, 128, 1")).toBe(true);
      expect(isRgbaValuesColorString("12, 3, 235, 4")).toBe(true);
      expect(isRgbaValuesColorString("255, 255, 255, 0.5")).toBe(true);
      expect(isRgbaValuesColorString("0, 0, 0, 0.37894725")).toBe(true);
    });

    it("should not accept negative values", () => {
      expect(isRgbaValuesColorString("-45, 12, 4")).toBe(false);
      expect(isRgbaValuesColorString("1, 255, -0")).toBe(false);
    });

    it("should accept even weirdly spaced strings", () => {
      expect(isRgbaValuesColorString("     46, 12   ,  255")).toBe(false);
    });

    it("should not accept values above 255", () => {
      expect(isRgbaValuesColorString("273, 4, 13093")).toBe(false);
    });

    it("should not accept floating numbers", () => {
      expect(isRgbaValuesColorString("12.6, 3, 2")).toBe(false);
    });

    it("should not accept simple rgb values", () => {
      expect(isRgbaValuesColorString("255, 255, 255")).toBe(false);
      expect(isRgbaValuesColorString("0, 0, 0")).toBe(false);
      expect(isRgbaValuesColorString("8, 96, 4")).toBe(false);
    });
  });

  describe("hexToRgbColor", () => {
    it("should return null for unexpected values", () => {
      // @ts-expect-error
      expect(hexToRgbColor(undefined)).toBe(null);
      // @ts-expect-error
      expect(hexToRgbColor(null)).toBe(null);
    });

    it("should convert hex to rgba", () => {
      expect(hexToRgbColor("#ffffff")).toBe("255, 255, 255, 1");
      expect(hexToRgbColor("#000000")).toBe("0, 0, 0, 1");
      expect(hexToRgbColor("#ff0000")).toBe("255, 0, 0, 1");
    });
  });
});
