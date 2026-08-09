import { describe, expect, it } from "vitest";

import { withBasePath } from "./paths";

describe("withBasePath", () => {
  it("returns path unchanged when basePath is empty", () => {
    expect(withBasePath("/category/ai-agent/", "")).toBe("/category/ai-agent/");
  });

  it("prefixes absolute paths with basePath", () => {
    expect(withBasePath("/category/ai-agent/", "/interviewHelpMe")).toBe(
      "/interviewHelpMe/category/ai-agent/",
    );
  });

  it("strips trailing slash from basePath before joining", () => {
    expect(withBasePath("/category/ai-agent/", "/interviewHelpMe/")).toBe(
      "/interviewHelpMe/category/ai-agent/",
    );
  });

  it("returns non-absolute paths unchanged", () => {
    expect(withBasePath("https://example.com/foo", "/interviewHelpMe")).toBe(
      "https://example.com/foo",
    );
  });
});
