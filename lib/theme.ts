export type Theme = "day" | "night";

const STORAGE_KEY = "care-desk-theme";
const CHANGE_EVENT = "care-desk:theme";

/** Inline <head> script. Day is the server default; only a saved "night" adds the class. */
export const themeScript = `(function(){try{if(localStorage.getItem("${STORAGE_KEY}")==="night")document.documentElement.classList.add("dark")}catch(e){}})()`;

export function storedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "night" ? "night" : "day";
  } catch {
    return "day"; // storage blocked (private mode, site data off): stay on Day
  }
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "night" : "day";
}

export function applyTheme(theme: Theme, persist = true) {
  document.documentElement.classList.toggle("dark", theme === "night");
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage blocked: the switch still applies for this page view
    }
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeTheme(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}
