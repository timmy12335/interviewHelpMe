"use client";

import { useT } from "@/i18n/PreferencesProvider";

/** 全站底部欄。 */
export function GlobalFooter() {
  const currentYear = new Date().getFullYear();
  const t = useT();

  return (
    <footer className="global-footer">
      <span>© {currentYear} InterviewHelpMe</span>
      <span className="global-footer__sep">{"//"}</span>
      <span>{t("footer.tagline")}</span>
      <span className="global-footer__sep">{"//"}</span>
      <span>{t("footer.source")}</span>
    </footer>
  );
}
