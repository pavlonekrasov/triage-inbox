/** A Mac, where the command key is ⌘ instead of Ctrl. Only call it in the browser. */
export const isMacPlatform = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
