import { describe, expect, it } from "vitest";
import { bindingFor, KEYMAP, type KeyPress } from "./shortcuts";

const press = (key: string, modifiers: Partial<Omit<KeyPress, "key">> = {}) =>
  bindingFor({ key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...modifiers })?.command ?? null;

describe("bindingFor", () => {
  it("maps the brief's keys (9.2)", () => {
    expect(press("j")).toBe("next");
    expect(press("]")).toBe("toggle-context");
    expect(press("x")).toBe("toggle-select");
    expect(press("X", { shiftKey: true })).toBe("select-sure-drafts");
    expect(press("Escape")).toBe("exit-selection");
  });

  it("opens the shortcut sheet with ?, whether the layout needs Shift for it or not", () => {
    expect(press("?", { shiftKey: true })).toBe("shortcuts");
    expect(press("?")).toBe("shortcuts");
  });

  it("opens the palette with Ctrl K or ⌘K, and never reads K with a modifier as Previous", () => {
    expect(press("k", { ctrlKey: true })).toBe("command-palette");
    expect(press("K", { metaKey: true })).toBe("command-palette");
    expect(press("k")).toBe("previous");
    expect(press("a", { ctrlKey: true })).toBeNull();
    expect(press("k", { ctrlKey: true, altKey: true })).toBeNull();
  });

  it("binds each key combination once, and names every binding with its key caps", () => {
    const combos = KEYMAP.map((b) => `${b.mod ? "mod+" : ""}${b.shift === true ? "shift+" : ""}${b.key}`);
    expect(new Set(combos).size).toBe(combos.length);
    for (const b of KEYMAP) {
      expect(b.label.length, b.command).toBeGreaterThan(0);
      expect(b.caps.length, b.command).toBeGreaterThan(0);
    }
  });
});
