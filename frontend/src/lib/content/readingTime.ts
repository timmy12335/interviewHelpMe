/**
 * 閱讀時間與講稿秒數的估算。
 * 目的是讓使用者在點開一塊內容前，先知道要付出多少時間，
 * 所以寧可粗略但一致，不追求精準。
 */

/**
 * 中文與拉丁字母的速度必須分開算。
 * 早期版本一律用中文語速套在所有字元上，把標點和英文都當成中文字，
 * 讓一段實測約 73 秒的講稿被報成 85 秒——高估了 16%。
 */
const CJK_PER_MINUTE = 300;
const LATIN_PER_MINUTE = 900;

/** 面試口說的語速。中文約 4.5 字／秒，英數則快得多。 */
const CJK_PER_SECOND = 4.5;
const LATIN_PER_SECOND = 14;

const CJK_RE = /[぀-ヿ一-鿿豈-﫿]/g;
const LATIN_RE = /[A-Za-z0-9]/g;

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

function strip(text: string): string {
  return STRIP_RULES.reduce(
    (acc, rule) => acc.replace(rule, ""),
    unwrapLinks(text),
  );
}

/**
 * 拆出中文與英數的字數。
 * 標點兩者都不算——它不佔發音時間，帶來的停頓已經含在語速裡了。
 */
function split(text?: string): { cjk: number; latin: number } {
  if (!text) {
    return { cjk: 0, latin: 0 };
  }

  const stripped = strip(text);

  return {
    cjk: (stripped.match(CJK_RE) ?? []).length,
    latin: (stripped.match(LATIN_RE) ?? []).length,
  };
}

/** 估算可讀字數：排除語法符號、程式碼與空白。 */
export function countReadableChars(text?: string): number {
  return text ? strip(text).length : 0;
}

/** 講稿的預估口說秒數；有內容時至少回傳 1 秒。 */
export function speakSeconds(text?: string): number {
  const { cjk, latin } = split(text);
  if (cjk === 0 && latin === 0) {
    return 0;
  }

  return Math.max(1, Math.round(cjk / CJK_PER_SECOND + latin / LATIN_PER_SECOND));
}

/** 預估閱讀分鐘數，無條件進位；有內容時至少回傳 1 分鐘。 */
export function readMinutes(text?: string): number {
  const { cjk, latin } = split(text);
  if (cjk === 0 && latin === 0) {
    return 0;
  }

  return Math.ceil(cjk / CJK_PER_MINUTE + latin / LATIN_PER_MINUTE);
}
