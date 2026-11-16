"use client";

import { usePreferences, useT } from "@/i18n/PreferencesProvider";

import "./index.css";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

/** 頂部列的語系與主題切換。 */
export function PrefsToggle() {
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const t = useT();
  const themeLabel = theme === "dark" ? t("toggle.themeToLight") : t("toggle.themeToDark");

  return (
    <div className="prefs-toggle">
      <button
        type="button"
        className="prefs-toggle__btn prefs-toggle__btn--lang"
        onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
        aria-label={t("toggle.langLabel")}
        title={t("toggle.langLabel")}
      >
        {t("toggle.lang")}
      </button>
      <button
        type="button"
        className="prefs-toggle__btn"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={themeLabel}
        title={themeLabel}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}
