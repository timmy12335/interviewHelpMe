"use client";

import type { MessageKey, MessageVars } from "./messages";
import { useLocalized, useT } from "./PreferencesProvider";

/**
 * 給 Server Component 用的翻譯文字。
 * 頁面本身在建置時靜態輸出，語系是瀏覽器端偏好，所以文字要交給 client 元件決定。
 */
export function T({ k, vars }: { k: MessageKey; vars?: MessageVars }) {
  const t = useT();
  return <>{t(k, vars)}</>;
}

/** 依語系顯示中文或英文版本的現成文字。 */
export function L({ zh, en }: { zh: string; en?: string }) {
  const pick = useLocalized();
  return <>{pick(zh, en)}</>;
}
