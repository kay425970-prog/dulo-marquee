"use client";

/**
 * Persistent player preferences shared by every playback surface:
 *  - subtitle language ("off" disables the universal subtitle engine)
 *  - video fit ("cover" = fill the screen, "contain" = letterbox)
 *  - subtitle styling (size / background) for readability on TVs
 */

export interface PlayerPrefs {
  subtitleLang: string;
  fitMode: "cover" | "contain";
  subtitleSize: "sm" | "md" | "lg";
  subtitleBg: boolean;
}

const KEY = "dulo_player_prefs_v1";

export const SUBTITLE_LANGUAGES = [
  { code: "off", label: "Off" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "tr", label: "Turkish" },
  { code: "pl", label: "Polish" },
  { code: "nl", label: "Dutch" },
  { code: "id", label: "Indonesian" },
] as const;

export const DEFAULT_PREFS: PlayerPrefs = {
  subtitleLang: "en",
  fitMode: "cover",
  subtitleSize: "md",
  subtitleBg: true,
};

export function loadPlayerPrefs(): PlayerPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<PlayerPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      fitMode: parsed.fitMode === "contain" ? "contain" : "cover",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePlayerPrefs(prefs: PlayerPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* storage may be unavailable (private mode / TV browser) */
  }
}

export function langLabel(code: string): string {
  return (
    SUBTITLE_LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase()
  );
}
