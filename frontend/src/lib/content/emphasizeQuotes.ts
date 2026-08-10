/**
 * 「面試回答方式」裡的「」引號，標的正是「面試當下要講出口的那句話」。
 * 273 題裡只有 7 題手動加了粗體，但幾乎每題都用了引號——直接把這個既有訊號
 * 轉成粗體，比要求內容全部重寫務實得多。
 */

/** 引號內容超過這個長度就不是「一句要講的話」，而是整段引述，不加粗。 */
const MAX_PHRASE_LENGTH = 60;

const QUOTED_RE = /「([^「」]+)」/g;

/** 行內程式碼與程式碼區塊：裡面的引號不該被改寫。 */
const CODE_SEGMENT_RE = /(```[\s\S]*?```|`[^`\n]*`)/;

function emphasizeSegment(text: string): string {
  return text.replace(QUOTED_RE, (match, inner: string) => {
    // 已經有強調標記就不再疊加，避免產生 ****text****
    if (inner.includes("*") || inner.length > MAX_PHRASE_LENGTH) {
      return match;
    }

    return `「**${inner}**」`;
  });
}

/**
 * 把「」引起來的短句轉成粗體，程式碼片段內不動。
 */
export function emphasizeQuotedPhrases(markdown: string): string {
  return markdown
    .split(CODE_SEGMENT_RE)
    .map((segment) =>
      segment.startsWith("`") ? segment : emphasizeSegment(segment),
    )
    .join("");
}
