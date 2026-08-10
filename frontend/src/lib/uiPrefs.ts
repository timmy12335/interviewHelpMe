/**
 * 版面偏好（欄位收合、區塊展開）只存在瀏覽器本機。
 * 與 progress.ts 相同，接受注入的 storage 以便單元測試與 SSR 安全呼叫。
 */

import type { StorageLike } from "./progress";

export const SIDER_COLLAPSED_KEY = "ihm:ui:sider-collapsed";
export const REF_COLLAPSED_KEY = "ihm:ui:ref-collapsed";
export const DETAIL_OPEN_KEY = "ihm:ui:detail-open";

const TRUE = "1";
const FALSE = "0";

/** 讀取布林偏好；沒有紀錄或讀取失敗時回傳 fallback。 */
export function readFlag(
  storage: StorageLike | undefined,
  key: string,
  fallback: boolean,
): boolean {
  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    if (raw === TRUE) {
      return true;
    }
    if (raw === FALSE) {
      return false;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeFlag(
  storage: StorageLike | undefined,
  key: string,
  value: boolean,
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value ? TRUE : FALSE);
  } catch {
    // 無痕模式或配額不足：偏好不保存，但不影響操作。
  }
}
