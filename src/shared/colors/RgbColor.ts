export class RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  public toString(): string {
    if (this.a === 1) {
      return `${this.r}, ${this.g}, ${this.b}`;
    } else {
      return `${this.r}, ${this.g}, ${this.b}, ${this.a}`;
    }
  }

  public toHex(): string {
    const rHex = this.r.toString(16).padStart(2, "0");
    const gHex = this.g.toString(16).padStart(2, "0");
    const bHex = this.b.toString(16).padStart(2, "0");

    if (this.a < 1) {
      const aHex = Math.round(this.a * 255)
        .toString(16)
        .padStart(2, "0");
      return `#${rHex}${gHex}${bHex}${aHex}`;
    }

    return `#${rHex}${gHex}${bHex}`;
  }
}
