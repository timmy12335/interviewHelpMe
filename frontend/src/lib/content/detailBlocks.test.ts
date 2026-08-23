import { describe, expect, it } from "vitest";

import { splitDetailBlocks } from "./detailBlocks";

describe("splitDetailBlocks", () => {
  it("splits paragraphs that open with a bold lead-in into separate blocks", () => {
    const detail = [
      "**第一個重點**：這裡是第一段的內容。",
      "**第二個重點**：這裡是第二段的內容。",
    ].join("\n\n");

    expect(splitDetailBlocks(detail)).toEqual([
      { heading: "第一個重點", body: "這裡是第一段的內容。" },
      { heading: "第二個重點", body: "這裡是第二段的內容。" },
    ]);
  });

  it("accepts a halfwidth colon after the bold lead-in", () => {
    expect(splitDetailBlocks("**重點**: 內容")).toEqual([
      { heading: "重點", body: "內容" },
    ]);
  });

  it("appends unlabelled paragraphs to the block above them", () => {
    const detail = [
      "**唯一重點**：第一段。",
      "接續說明的第二段。",
    ].join("\n\n");

    expect(splitDetailBlocks(detail)).toEqual([
      { heading: "唯一重點", body: "第一段。\n\n接續說明的第二段。" },
    ]);
  });

  it("keeps leading paragraphs without a heading as an intro block", () => {
    const detail = ["先講一段開場。", "**接著的重點**：內容。"].join("\n\n");

    expect(splitDetailBlocks(detail)).toEqual([
      { heading: undefined, body: "先講一段開場。" },
      { heading: "接著的重點", body: "內容。" },
    ]);
  });

  it("returns a single headless block when nothing is labelled", () => {
    expect(splitDetailBlocks("就是一整段沒有小標的文字。")).toEqual([
      { heading: undefined, body: "就是一整段沒有小標的文字。" },
    ]);
  });

  it("does not treat a fully bold paragraph as a heading", () => {
    expect(splitDetailBlocks("**整段都是粗體但沒有冒號**")).toEqual([
      { heading: undefined, body: "**整段都是粗體但沒有冒號**" },
    ]);
  });

  it("ignores bold text that is not at the start of the paragraph", () => {
    const detail = "開頭有字 **這不是小標**：後面。";

    expect(splitDetailBlocks(detail)).toEqual([
      { heading: undefined, body: detail },
    ]);
  });

  it("returns an empty list for blank input", () => {
    expect(splitDetailBlocks("")).toEqual([]);
    expect(splitDetailBlocks("   \n\n  ")).toEqual([]);
  });

  it("does not split on a bold lead-in inside a fenced code block", () => {
    const detail = [
      "**重點**：看這段程式。",
      "```java\n// **不是小標**：這是註解\nint a = 1;\n```",
    ].join("\n\n");

    const blocks = splitDetailBlocks(detail);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].body).toContain("```java");
  });
});
