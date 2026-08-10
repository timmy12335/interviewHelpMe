import { describe, expect, it } from "vitest";

import {
  fallbackLabel,
  parseWikiTarget,
  replaceWikiLinks,
  type WikiLinkResolver,
} from "./wikiLinks";

const resolveAll: WikiLinkResolver = (target) => ({
  href: `/category/${target.categorySlug}/question/${target.slug}/`,
  label: `題目：${target.slug}`,
});

const resolveNone: WikiLinkResolver = () => null;

describe("parseWikiTarget", () => {
  it("treats a bare file name as the current category", () => {
    expect(parseWikiTarget("003-load-balancing.md", "system-design")).toEqual({
      categorySlug: "system-design",
      slug: "load-balancing",
    });
  });

  it("reads the category from a relative path", () => {
    expect(
      parseWikiTarget("../backend-engineering/017-consistent-hashing.md", "redis"),
    ).toEqual({
      categorySlug: "backend-engineering",
      slug: "consistent-hashing",
    });
  });

  it("accepts the surrounding brackets", () => {
    expect(parseWikiTarget("[[003-load-balancing.md]]", "system-design")).toEqual(
      { categorySlug: "system-design", slug: "load-balancing" },
    );
  });

  it("keeps slugs that have no numeric prefix", () => {
    expect(parseWikiTarget("load-balancing.md", "system-design")?.slug).toBe(
      "load-balancing",
    );
  });

  it("returns null for input it cannot resolve", () => {
    expect(parseWikiTarget("", "system-design")).toBeNull();
    expect(parseWikiTarget("   ", "system-design")).toBeNull();
    expect(parseWikiTarget("../", "system-design")).toBeNull();
  });
});

describe("fallbackLabel", () => {
  it("turns the slug into readable words", () => {
    expect(
      fallbackLabel({ categorySlug: "system-design", slug: "load-balancing" }),
    ).toBe("load balancing");
  });
});

describe("replaceWikiLinks", () => {
  it("rewrites an inline link into markdown", () => {
    const out = replaceWikiLinks(
      "詳見 [[003-load-balancing.md]] 的說明。",
      "system-design",
      resolveAll,
    );

    expect(out).toBe(
      "詳見 [題目：load-balancing](/category/system-design/question/load-balancing/) 的說明。",
    );
  });

  it("rewrites every occurrence in the text", () => {
    const out = replaceWikiLinks(
      "[[001-a.md]] 與 [[../redis/002-b.md]]",
      "java",
      resolveAll,
    );

    expect(out).toContain("/category/java/question/a/");
    expect(out).toContain("/category/redis/question/b/");
    expect(out).not.toContain("[[");
  });

  it("leaves the original text alone when the target cannot be resolved", () => {
    const input = "詳見 [[003-load-balancing.md]]。";

    expect(replaceWikiLinks(input, "system-design", resolveNone)).toBe(input);
  });

  it("escapes brackets in the label so the markdown link stays valid", () => {
    const out = replaceWikiLinks("[[001-a.md]]", "java", () => ({
      href: "/x/",
      label: "陣列 [0] 的行為",
    }));

    expect(out).toBe("[陣列 \\[0\\] 的行為](/x/)");
  });

  it("passes through text that has no wiki links", () => {
    expect(replaceWikiLinks("沒有連結。", "java", resolveAll)).toBe("沒有連結。");
  });
});
