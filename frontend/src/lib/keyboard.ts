const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * 判斷事件目標是否為輸入中的欄位。
 * 快捷鍵必須先問過這個，否則在作答框打 j / k / a 會被吃掉。
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
}
