/**
 * 全站規則：任何原始碼都不得使用 dangerouslySetInnerHTML。
 *
 * 這條規則原本寫在 CheatSheet.test.tsx，只檢查
 * `CheatSheetView.toString()`——但 `.toString()` 只看得到這一個函式自己的
 * 原始碼，看不進它呼叫的 BlockRenderer，更看不進底下五個原語元件。曾經
 * 把 dangerouslySetInnerHTML 加進 TableBlock.tsx 驗證過：18 個 cheat sheet
 * 測試全部維持綠燈，因為沒有一個斷言真的碰得到那段程式碼。
 *
 * 改成掃描整個 src 底下的檔案內容，才是「全站 0 處」這句話真正要檢查的
 * 範圍，而不是只顧到 cheat sheet 這一個功能。放在 src/test/ 而不是
 * CheatSheet 元件底下，是因為它現在跟 cheat sheet 沒有任何關係——這是
 * 對整個程式庫的規則，跟 src/test/setup.ts 一樣是跨功能的測試基礎設施。
 *
 * 排除本檔要用「路徑」排除，不能用「內容」排除：用內容排除的話，任何
 * 真正的違規只要出現在同一份檔案裡就會被一起放過。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF_PATH = path.resolve(fileURLToPath(import.meta.url));
const FORBIDDEN = "dangerouslySetInnerHTML";
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }
    return SOURCE_FILE_PATTERN.test(entry.name) ? [fullPath] : [];
  });
}

describe("全站安全規則", () => {
  it("原始碼裡沒有任何一處 dangerouslySetInnerHTML", () => {
    const offenders = listSourceFiles(SRC_ROOT)
      .filter((file) => path.resolve(file) !== SELF_PATH)
      .filter((file) => fs.readFileSync(file, "utf8").includes(FORBIDDEN))
      .map((file) => path.relative(SRC_ROOT, file));

    expect(offenders).toEqual([]);
  });
});
