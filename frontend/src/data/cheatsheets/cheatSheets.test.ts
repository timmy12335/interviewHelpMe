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
});

/** 攤平一張速查表的所有 block，含 compare 內嵌的那一層。 */
function allBlocks(blocks: Block[]): Block[] {
  return blocks.flatMap((block) =>
    block.kind === "compare"
      ? [block, ...block.items.flatMap((item) => item.blocks)]
      : [block],
  );
}
