import { describe, expect, it } from "vitest";

import { cheatSheets } from "@/data/cheatsheets";

import { resolveRelatedQuestions } from "./relatedQuestions";

describe("resolveRelatedQuestions", () => {
  it("沒有 ref 時回傳空陣列", () => {
    expect(resolveRelatedQuestions()).toEqual([]);
    expect(resolveRelatedQuestions([])).toEqual([]);
  });

  it("把 slug 解析成真實的題目標題", () => {
    const [link] = resolveRelatedQuestions(["system-design/flash-sale-design"]);

    expect(link.href).toBe("/category/system-design/question/flash-sale-design/");
    expect(link.category).toBe("系統設計");
    // 標題來自 content/，不寫死；只要求它不是 slug 本身。
    expect(link.title).not.toBe("flash-sale-design");
    expect(link.title.length).toBeGreaterThan(0);
  });

  // 分類名稱都以「面試題」結尾，當標籤時那三個字每一列都重複一次，沒有資訊量。
  it("分類標籤去掉「面試題」後綴", () => {
    const [link] = resolveRelatedQuestions(["algorithms/complexity-analysis"]);
    expect(link.category).toBe("演算法與資料結構");
  });

  // 這是畫面上唯一看得出「ref 寫錯了」的地方，退回 slug 至少連結還是對的；
  // 真正的把關在 cheatSheets.test.ts，那裡會讓不存在的 ref 直接測試失敗。
  it("查不到題目時退回 slug，不會壞掉", () => {
    const [link] = resolveRelatedQuestions(["system-design/does-not-exist"]);

    expect(link.title).toBe("does-not-exist");
    expect(link.href).toBe("/category/system-design/question/does-not-exist/");
  });

  // 速查表宣稱「速記 → 深挖是一條路徑」。如果解析回來的標題其實都是 slug，
  // 那條路徑在畫面上就斷了，而且不會有任何錯誤訊息。
  it("每張速查表的延伸題目都解析得出真實標題", () => {
    const unresolved = cheatSheets.flatMap((sheet) =>
      resolveRelatedQuestions(sheet.relatedQuestions)
        .filter((link) => link.href.includes(`/${link.title}/`))
        .map((link) => `${sheet.slug}：${link.title}`),
    );

    expect(unresolved).toEqual([]);
  });
});
