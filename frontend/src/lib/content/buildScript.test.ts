import { describe, expect, it } from "vitest";

import {
  buildScript,
  buildFromCore,
  insertScriptSection,
  readScriptSection,
  replaceScriptSection,
} from "@scripts/gen-scripts.mjs";

describe("buildScript", () => {
  it("turns each quoted sentence into its own spoken paragraph", () => {
    const tip = "先給出核心答案——「Agent 是以 LLM 為決策引擎的系統，能自主循環」。";

    expect(buildScript(tip)).toBe(
      "我的理解是，Agent 是以 LLM 為決策引擎的系統，能自主循環。",
    );
  });

  it("keeps spaces inside latin phrases but drops line-wrap spaces between CJK", () => {
    const tip = "先講「這用的是 Chain of Thought 這種展 開推理的做法，效果不錯」。";

    expect(buildScript(tip)).toContain("Chain of Thought");
    expect(buildScript(tip)).toContain("展開推理");
  });

  it("picks a connector that matches what the narration signalled", () => {
    const tip = [
      "先講「這是第一個要說明的核心重點，內容大致是這樣」。",
      "可以誠實補充實務侷限——「這個做法會帶來額外的執行成本與延遲」。",
    ].join("");

    expect(buildScript(tip)).toContain("不過要誠實說，這個做法會帶來額外的執行成本與延遲。");
  });

  it("never reuses the same connector twice in one script", () => {
    const tip = [
      "先講「這是第一個要說明的核心重點，內容大致是這樣」。",
      "可以補充「這是第二個要說明的核心重點，內容大致是這樣」。",
      "可以補充「這是第三個要說明的核心重點，內容大致是這樣」。",
    ].join("");

    const connectors = (buildScript(tip) ?? "")
      .split("\n\n")
      .slice(1)
      .map((line: string) => line.slice(0, line.indexOf("，") + 1));

    expect(new Set(connectors).size).toBe(connectors.length);
  });

  it("ignores short quotes that are inline emphasis rather than speech", () => {
    expect(buildScript("要講清楚「為什麼只影響局部」這個性質。")).toBeNull();
  });

  it("returns null when there is nothing quotable to say", () => {
    expect(buildScript("先講清楚傳統雜湊取模的問題，接著講虛擬節點。")).toBeNull();
  });

  it("does not add a second opener when the sentence already has one", () => {
    const tip = "先講「我認為這題的關鍵在於資料一致性的取捨」。";

    expect(buildScript(tip)).toBe("我認為這題的關鍵在於資料一致性的取捨。");
  });

  it("strips bold markers and trailing punctuation from the quote", () => {
    const tip = "先講「**索引的本質是用空間換取查詢時間，代價是寫入變慢**，」。";

    expect(buildScript(tip)).toBe("我的理解是，索引的本質是用空間換取查詢時間，代價是寫入變慢。");
  });
});

describe("insertScriptSection", () => {
  it("inserts the script section above 常見追問", () => {
    const markdown = "## 面試回答方式\n\n提示\n\n## 常見追問\n\n### 追問\n";

    expect(insertScriptSection(markdown, "講稿內容")).toBe(
      "## 面試回答方式\n\n提示\n\n## 講稿\n\n講稿內容\n\n## 常見追問\n\n### 追問\n",
    );
  });

  it("falls back to 相關 when there are no follow-ups", () => {
    const markdown = "## 面試回答方式\n\n提示\n\n## 相關\n\n- [[a.md]]\n";

    expect(insertScriptSection(markdown, "講稿內容")).toContain(
      "## 講稿\n\n講稿內容\n\n## 相關",
    );
  });

  it("appends to the end when neither heading exists", () => {
    expect(insertScriptSection("## 面試回答方式\n\n提示\n", "講稿內容")).toBe(
      "## 面試回答方式\n\n提示\n\n## 講稿\n\n講稿內容\n",
    );
  });
});

describe("buildFromCore", () => {
  it("strips bold markers, backticks and wiki-link citations", () => {
    const core =
      "索引的本質是**用空間換時間**，靠 `B+ 樹` 維護排序（見 [[001-btree.md]]），讓查詢不必全表掃描。";

    const script = buildFromCore(core);

    expect(script).not.toContain("**");
    expect(script).not.toContain("`");
    expect(script).not.toContain("[[");
    expect(script).not.toContain("見 ");
    expect(script).toContain("B+ 樹");
  });

  it("turns an enumerated core answer into one beat per step", () => {
    const core =
      "排查流程是：**（1）定位**——先看慢查詢日誌找出影響最大的 SQL。**（2）分析**——對它執行 EXPLAIN 檢查索引。**（3）優化**——補索引或改寫 SQL。";

    const beats = (buildFromCore(core) ?? "").split("\n\n");

    expect(beats).toHaveLength(3);
    expect(beats[1]).toContain("分析");
  });

  it("returns null when there is no core answer", () => {
    expect(buildFromCore("")).toBeNull();
    expect(buildFromCore(undefined)).toBeNull();
  });
});

describe("buildScript with a core-answer fallback", () => {
  const thinTip = "先給框架——「定位、分析、優化、驗證這四步」。";
  const core =
    "排查慢查詢的標準流程有四步。先看慢查詢日誌，搭配工具把記錄依相同的 SQL 模式歸類、統計出現次數與總耗時，找出影響面最大的少數幾條，而不是逐一處理每一條。接著對這些鎖定的 SQL 執行 EXPLAIN，檢查有沒有走到預期的索引、有沒有全表掃描、有沒有額外排序或臨時表這些警示訊號。然後根據分析結果對症下藥，補索引、改寫 SQL，必要時做分頁優化或引入快取。最後重新執行 EXPLAIN 確認執行計畫真的改善了，並在實際環境觀察慢查詢日誌確認耗時明顯下降。";

  it("falls back to the core answer when the quoted material is too thin", () => {
    const script = buildScript(thinTip, core) ?? "";

    expect(script).toContain("慢查詢日誌");
    expect(script.length).toBeGreaterThan(150);
  });

  it("keeps the quote-derived script when it is substantial enough", () => {
    const richTip = [
      "先講「ReAct 讓模型在執行任務的每一輪循環裡，明確地以文字形式交替生成思考、行動、觀察這三種內容，思考是用類似思維鏈的方式展開推理過程」。",
      "可以誠實補充侷限——「每一輪都要求完整展開思考，也意味著額外的推理呼叫和時間延遲，累積起來可能帶來相當可觀的整體執行成本」。",
    ].join("");

    expect(buildScript(richTip, core)).toContain("ReAct");
    expect(buildScript(richTip, core)).not.toContain("慢查詢日誌");
  });

  it("returns null when neither source has usable material", () => {
    expect(buildScript("先講清楚背景，接著談解法。", "")).toBeNull();
  });
});

describe("readScriptSection / replaceScriptSection", () => {
  // 曾經用 `\Z` 當結尾錨點，但那在 JS 正則裡是字面上的 Z，
  // 讓 ZGC、ZSet、「大寫 A 到 Z」這類內容在該處被攔腰截斷。
  const withZ =
    "## 講稿\n\n第一段提到 ZGC 和 ZSet，還有大寫 A 到 Z。\n\n第二段在 Z 後面，不能被吃掉。\n\n## 常見追問\n\n### 追問\n";

  it("reads the whole section even when it contains an uppercase Z", () => {
    expect(readScriptSection(withZ)).toBe(
      "第一段提到 ZGC 和 ZSet，還有大寫 A 到 Z。\n\n第二段在 Z 後面，不能被吃掉。",
    );
  });

  it("replaces the whole section rather than stopping at an uppercase Z", () => {
    const next = replaceScriptSection(withZ, "全新講稿");

    expect(readScriptSection(next)).toBe("全新講稿");
    expect(next).not.toContain("第二段在 Z 後面");
    expect(next).toContain("## 常見追問");
  });

  it("reads a section that runs to the end of the file", () => {
    expect(readScriptSection("## 講稿\n\n最後一個區塊的內容。\n")).toBe(
      "最後一個區塊的內容。",
    );
  });

  it("returns null when there is no script section", () => {
    expect(readScriptSection("## 核心答案\n\n內容\n")).toBeNull();
  });
});
