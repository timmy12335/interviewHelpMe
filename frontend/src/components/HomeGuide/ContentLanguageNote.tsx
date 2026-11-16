"use client";

import { usePreferences, useT } from "@/i18n/PreferencesProvider";

/** 英文介面時提醒：題目內容本身仍是中文，免得以為翻譯壞了。 */
export function ContentLanguageNote({ className }: { className?: string }) {
  const { locale } = usePreferences();
  const t = useT();

  if (locale !== "en") {
    return null;
  }

  return <p className={className}>{t("contentNote")}</p>;
}
