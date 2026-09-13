const NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese" };

const base = (bcp47: string) => bcp47.split("-")[0].toLowerCase();

/** "es-MX" → "ES". */
export const languageCode = (bcp47: string) => base(bcp47).toUpperCase();

/** "pt-BR" → "Portuguese". The base language only: the specialist needs the language, not the region. */
export const languageName = (bcp47: string) => NAMES[base(bcp47)] ?? languageCode(bcp47);

export const isEnglish = (bcp47: string) => base(bcp47) === "en";
