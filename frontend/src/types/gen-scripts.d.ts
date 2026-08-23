/**
 * `scripts/gen-scripts.mjs` 是 repo 根的純 ESM 內容工具，沒有自帶型別。
 * 這裡宣告它的公開介面，讓單元測試能在型別檢查下使用它，
 * 而不是靠 `@ts-expect-error` 把整個 import 的錯誤蓋掉。
 */
declare module "@scripts/gen-scripts.mjs" {
  /** 由「面試回答方式」的引號組稿，太薄時退回核心答案；都不足時回傳 null。 */
  export function buildScript(
    interviewTip: string,
    coreAnswer?: string,
  ): string | null;

  /** 把書面的核心答案洗成可以念出口的段落。 */
  export function buildFromCore(coreAnswer?: string): string | null;

  /** 在「常見追問」之前插入講稿區塊。 */
  export function insertScriptSection(markdown: string, script: string): string;

  /** 讀出既有的講稿內容，沒有就回傳 null。 */
  export function readScriptSection(markdown: string): string | null;

  /** 就地換掉既有的講稿內容。 */
  export function replaceScriptSection(markdown: string, script: string): string;
}
