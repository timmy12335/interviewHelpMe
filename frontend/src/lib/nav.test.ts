import { describe, expect, it } from "vitest";

import type { MenuItem } from "@/config/menu";
import { isActiveMenuItem, normalisePath } from "./nav";

const home: MenuItem = { path: "/", name: "主頁" };
const categories: MenuItem = {
  path: "/categories",
  name: "題庫",
  matchPrefixes: ["/category"],
};
const questions: MenuItem = { path: "/questions", name: "題目" };

describe("normalisePath", () => {
  it("strips a trailing slash so both pathname spellings compare equal", () => {
    expect(normalisePath("/questions/")).toBe("/questions");
    expect(normalisePath("/questions")).toBe("/questions");
  });

  it("keeps the root path as a single slash", () => {
    expect(normalisePath("/")).toBe("/");
  });
});

describe("isActiveMenuItem", () => {
  it("marks home active only on the root path", () => {
    expect(isActiveMenuItem("/", home)).toBe(true);
    expect(isActiveMenuItem("/questions/", home)).toBe(false);
    expect(isActiveMenuItem("/categories/", home)).toBe(false);
  });

  it("matches a menu item regardless of trailing slash", () => {
    expect(isActiveMenuItem("/questions", questions)).toBe(true);
    expect(isActiveMenuItem("/questions/", questions)).toBe(true);
  });

  it("matches pages nested under a menu item", () => {
    expect(isActiveMenuItem("/categories/java/", categories)).toBe(true);
  });

  it("treats the singular /category detail routes as part of the category section", () => {
    expect(isActiveMenuItem("/category/real-interviews/", categories)).toBe(true);
    expect(
      isActiveMenuItem("/category/real-interviews/question/meituan-flash-sale/", categories),
    ).toBe(true);
  });

  it("does not match a sibling route that merely shares a prefix string", () => {
    expect(isActiveMenuItem("/questions-archive/", questions)).toBe(false);
    expect(isActiveMenuItem("/categories-archive/", categories)).toBe(false);
  });

  it("keeps unrelated sections inactive", () => {
    expect(isActiveMenuItem("/category/java/", questions)).toBe(false);
    expect(isActiveMenuItem("/questions/", categories)).toBe(false);
  });
});
