export type Rgb = readonly [number, number, number];

const UNSET = "oklch(0 0 0 / 0)";

/**
 * Resolves a custom property to the colour the browser computed inside `probe`'s theme scope.
 * Returns null when the token is not defined there, instead of silently reading an inherited colour.
 */
export function resolveColor(probe: HTMLElement, token: string): string | null {
  if (!getComputedStyle(probe).getPropertyValue(token).trim()) return null;
  probe.style.color = `var(${token})`;
  const value = getComputedStyle(probe).color;
  probe.style.color = "";
  return value;
}

/**
 * Paints colours bottom to top on a 1×1 sRGB canvas and reads the pixel back. Canvas blends alpha
 * in gamma-encoded sRGB, the same way CSS paints a wash over a card, so the result is the 8-bit
 * value the page puts on screen. The first layer must be opaque.
 */
export function createCompositor() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { colorSpace: "srgb", willReadFrequently: true });

  return (layers: readonly string[]): Rgb | null => {
    if (!ctx) return null;
    ctx.clearRect(0, 0, 1, 1);
    for (const layer of layers) {
      ctx.fillStyle = UNSET;
      const before = ctx.fillStyle;
      ctx.fillStyle = layer;
      // An unparseable colour leaves fillStyle unchanged; report it rather than paint the wrong one.
      if (ctx.fillStyle === before && layer !== UNSET) return null;
      ctx.fillRect(0, 0, 1, 1);
    }
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  };
}

const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = ([r, g, b]: Rgb) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/** WCAG 2 contrast ratio. Never round up before comparing: 4.497 fails 4.5. */
export function contrastRatio(a: Rgb, b: Rgb) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
