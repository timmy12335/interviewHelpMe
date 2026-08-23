/**
 * 閱讀時間與講稿秒數的估算。
 * 目的是讓使用者在點開一塊內容前，先知道要付出多少時間，
 * 所以寧可粗略但一致，不追求精準。
 */

/** 中文技術文字的閱讀速度（字／分）。密度高，取偏保守的值。 */
const CHARS_PER_MINUTE = 300;

/** 面試口說的語速（字／秒）。335 字約 75 秒，符合一段回答的長度。 */
const CHARS_PER_SECOND = 4.5;

const STRIP_RULES: RegExp[] = [
  /```[\s\S]*?```/g, // 程式碼區塊
  /`[^`\n]*`/g, // 行內程式碼
  /!\[[^\]]*\]\([^)]*\)/g, // 圖片
  /[*_~#>-]/g, // 強調、標題、清單符號
  /\s+/g, // 空白與換行
];

/** 把 Markdown 連結收斂成純文字標籤，只留下真正會被讀到的字。 */
function unwrapLinks(text: string): string {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

/** 估算可讀字數：排除語法符號、程式碼與空白。 */
export function countReadableChars(text?: string): number {
  if (!text) {
    return 0;
  }

  return STRIP_RULES.reduce(
    (acc, rule) => acc.replace(rule, ""),
    unwrapLinks(text),
  ).length;
}

/** 講稿的預估口說秒數；有內容時至少回傳 1 秒。 */
export function speakSeconds(text?: string): number {
  const chars = countReadableChars(text);
  if (chars === 0) {
    return 0;
  }

  return Math.max(1, Math.round(chars / CHARS_PER_SECOND));
}

/** 預估閱讀分鐘數，無條件進位；有內容時至少回傳 1 分鐘。 */
export function readMinutes(text?: string): number {
  const chars = countReadableChars(text);
  if (chars === 0) {
    return 0;
  }

  return Math.ceil(chars / CHARS_PER_MINUTE);
}
