"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getBrowserStorage } from "@/lib/progress";

import { translate, type Locale, type MessageKey, type MessageVars } from "./messages";
import { LOCALE_KEY, THEME_KEY, readLocale, readTheme, writePref, type Theme } from "./prefs";

type PreferencesValue = {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
};

/*
 * 沒有 Provider 時（單元測試、Storybook）退回中文與深色，
 * 元件照舊渲染中文，既有的測試斷言不必改。
 */
const PreferencesContext = createContext<PreferencesValue>({
  locale: "zh",
  theme: "dark",
  setLocale: () => {},
  setTheme: () => {},
});

/**
 * 全站語系與主題。
 * SSR 與首次渲染固定用中文、深色，掛載後才讀本機偏好，避免 hydration 不一致；
 * 主題的 CSS 由 public/prefs-init.js 在繪製前就先套上，所以不會閃。
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const storage = getBrowserStorage();
    setLocaleState(readLocale(storage));
    setThemeState(readTheme(storage) ?? "dark");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale === "en" ? "en" : "zh-Hant");
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writePref(getBrowserStorage(), LOCALE_KEY, next);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    writePref(getBrowserStorage(), THEME_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ locale, theme, setLocale, setTheme }),
    [locale, theme, setLocale, setTheme],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesValue {
  return useContext(PreferencesContext);
}

export type TranslateFn = (key: MessageKey, vars?: MessageVars) => string;

/** 取得目前語系的翻譯函式。 */
export function useT(): TranslateFn {
  const { locale } = usePreferences();
  return useCallback(
    (key: MessageKey, vars?: MessageVars) => translate(locale, key, vars),
    [locale],
  );
}

/** 依語系挑選兩段現成文字（例如題庫的中英文名稱）。 */
export function useLocalized(): (zh: string, en?: string) => string {
  const { locale } = usePreferences();
  return useCallback(
    (zh: string, en?: string) => (locale === "en" && en ? en : zh),
    [locale],
  );
}
