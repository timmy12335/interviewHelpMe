/**
 * 語系與主題偏好的純函式部分；與 uiPrefs.ts 一樣接受注入的 storage，方便測試。
 * public/prefs-init.js 會在繪製前讀同樣的鍵，改名時兩邊要一起改。
 */

import type { StorageLike } from "@/lib/progress";

import type { Locale } from "./messages";

export type Theme = "dark" | "light";

export const THEME_KEY = "ihm:ui:theme";
export const LOCALE_KEY = "ihm:ui:locale";

export function readLocale(storage: StorageLike | undefined): Locale {
  try {
    return storage?.getItem(LOCALE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

/** 沒存過主題時回傳 undefined，由呼叫端決定預設（目前是深色）。 */
export function readTheme(storage: StorageLike | undefined): Theme | undefined {
  try {
    const raw = storage?.getItem(THEME_KEY);
    return raw === "light" || raw === "dark" ? raw : undefined;
  } catch {
    return undefined;
  }
}

export function writePref(
  storage: StorageLike | undefined,
  key: string,
  value: string,
): void {
  try {
    storage?.setItem(key, value);
  } catch {
    // 無痕模式或配額不足：偏好不保存，但切換本身仍然生效。
  }
}
