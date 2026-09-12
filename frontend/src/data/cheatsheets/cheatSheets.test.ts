import { describe, expect, it } from "vitest";

import { cheatSheets, getCheatSheet } from "./index";

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
});
