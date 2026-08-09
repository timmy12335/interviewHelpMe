import { describe, expect, it } from "vitest";

import { parseQuestionMarkdown } from "./parseQuestionMarkdown";

const VALID_RAW = `---
id: ai-agent-001
category: ai-agent
slug: agent-fundamentals
title: AI Agent 基本定義與核心組成
difficulty: easy
tags: [Agent, 基礎概念]
---

# 題目

什麼是 AI Agent？

## 核心答案

AI Agent 是以 LLM 為核心決策引擎的系統。
`;

describe("parseQuestionMarkdown", () => {
  it("maps frontmatter fields to Question", () => {
    const result = parseQuestionMarkdown(VALID_RAW, "content/ai-agent/001.md");

    expect(result).toEqual({
      id: "ai-agent-001",
      slug: "agent-fundamentals",
      title: "AI Agent 基本定義與核心組成",
      difficulty: "easy",
      tags: ["Agent", "基礎概念"],
      categorySlug: "ai-agent",
      content: "什麼是 AI Agent？",
      answer: "## 核心答案\n\nAI Agent 是以 LLM 為核心決策引擎的系統。",
    });
  });

  it("splits content and answer at headings", () => {
    const result = parseQuestionMarkdown(VALID_RAW, "test.md");

    expect(result.content).toBe("什麼是 AI Agent？");
    expect(result.answer).toContain("## 核心答案");
    expect(result.answer).toContain("AI Agent 是以 LLM 為核心決策引擎的系統。");
  });

  it("throws with file path when title is missing", () => {
    const raw = `---
id: x-001
category: ai-agent
slug: x
difficulty: easy
---

# 題目

題目內容

## 核心答案

答案
`;

    expect(() => parseQuestionMarkdown(raw, "content/x/001.md")).toThrow(
      'content/x/001.md: missing or invalid frontmatter "title"',
    );
  });
});
