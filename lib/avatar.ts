import type { CSSProperties } from "react";

/** Stable hue from the customer id, so one customer keeps one tint in the list, header and panel. */
export function avatarHue(customerId: string): number {
  let hash = 0;
  for (const char of customerId) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return hash % 360;
}

/** Pairs with the `avatar-tint` utility in globals.css, which owns lightness and chroma. */
export const avatarStyle = (customerId: string) =>
  ({ "--avatar-h": avatarHue(customerId) }) as CSSProperties;

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
