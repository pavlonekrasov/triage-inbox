"use client";

import { useLayoutEffect } from "react";
import { applyTheme, storedTheme } from "@/lib/theme";

/**
 * React's development remount resets <html> to the attributes it renders from JSX, which drops the
 * `dark` class the head script added. Re-apply before paint. In production this is a no-op.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    applyTheme(storedTheme(), false);
  }, []);
  return null;
}
