import { describe, expect, it } from "vitest";

import { cheatSheets, getCheatSheet } from "./index";
import { getAllQuestions } from "@/lib/content/loadContent";

import type { Block } from "./types";

describe("cheat sheet 資料", () => {
  it("至少有一張速查表", () => {
    expect(cheatSheets.length).toBeGreaterThan(0);
  });

  it("slug 全站唯一", () => {
    const slugs = cheatSheets.map((sheet) => sheet.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slug 只含 URL 安全字元", () => {
    const bad = cheatSheets
      .map((sheet) => sheet.slug)
      .filter((slug) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug));
    expect(bad).toEqual([]);
  });

  it("getCheatSheet 找得到既有的、找不到不存在的", () => {
    expect(getCheatSheet(cheatSheets[0].slug)).toBe(cheatSheets[0]);
    expect(getCheatSheet("does-not-exist")).toBeUndefined();
  });

  it("每個 section 至少有一個 block", () => {
    const empty = cheatSheets.flatMap((sheet) =>
      sheet.sections
        .filter((section) => section.blocks.length === 0)
        .map((section) => `${sheet.slug} / ${section.title}`),
    );
    expect(empty).toEqual([]);
  });

  it("table 每一列的欄數等於表頭欄數", () => {
    // 欄數不一致在畫面上只會看成排版歪掉，不會報錯。
    const wrong = cheatSheets.flatMap((sheet) =>
      sheet.sections.flatMap((section) =>
        allBlocks(section.blocks).flatMap((block) =>
          block.kind === "table"
            ? block.rows
                .filter((row) => row.length !== block.head.length)
                .map(
                  (row) =>
                    `${sheet.slug}：表頭 ${block.head.length} 欄，有一列 ${row.length} 欄`,
                )
            : [],
        ),
      ),
    );
    expect(wrong).toEqual([]);
  });

  it("compare 內不得再有 compare（限一層巢狀）", () => {
    const nested = cheatSheets.flatMap((sheet) =>
      sheet.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
          block.kind === "compare"
            ? block.items
                .filter((item) => item.blocks.some((inner) => inner.kind === "compare"))
                .map((item) => `${sheet.slug} / ${item.name}`)
            : [],
        ),
      ),
    );
    expect(nested).toEqual([]);
  });

  it("relatedQuestions 都指向真實存在的題目", () => {
    // 打錯只會產生一個 404 連結，不會有任何錯誤訊息。
    const index = new Set(
      getAllQuestions().map((question) => `${question.categorySlug}/${question.slug}`),
    );
    const broken = cheatSheets.flatMap((sheet) =>
      (sheet.relatedQuestions ?? [])
        .filter((ref) => !index.has(ref))
        .map((ref) => `${sheet.slug} 指向不存在的 ${ref}`),
    );
    expect(broken).toEqual([]);
  });

  it("每張速查表至少有一個 relatedQuestions，讓速記能接回題庫", () => {
    // relatedQuestions 是選填欄位，漏掉不會報錯——但速查表的第三個設計目標
    // 就是「速記 → 深挖」要走得通。漏掉這個欄位，畫面上完全看不出來，
    // 使用者看完速查表就沒有下一步了。
    const missing = cheatSheets
      .filter((sheet) => (sheet.relatedQuestions ?? []).length === 0)
      .map((sheet) => sheet.slug);

    expect(missing).toEqual([]);
  });

  it("relatedQuestions 在同一張表內不重複", () => {
    // 重複既是內容錯誤（同一題被列兩次），也是 key 隱患
    // （CheatSheetRelated 若改回用內容當 key 會馬上撞名）。
    const duplicated = cheatSheets.flatMap((sheet) => {
      const refs = sheet.relatedQuestions ?? [];
      const seen = new Set<string>();
      const dupes = new Set<string>();
      for (const ref of refs) {
        if (seen.has(ref)) {
          dupes.add(ref);
        }
        seen.add(ref);
      }
      return [...dupes].map((ref) => `${sheet.slug} 的 relatedQuestions 重複了 ${ref}`);
    });

    expect(duplicated).toEqual([]);
  });
});

/** 攤平一張速查表的所有 block，含 compare 內嵌的那一層。 */
function allBlocks(blocks: Block[]): Block[] {
  return blocks.flatMap((block) =>
    block.kind === "compare"
      ? [block, ...block.items.flatMap((item) => item.blocks)]
      : [block],
  );
}
