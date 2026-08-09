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

## 詳細解析

詳細說明 Agent 與單次問答的差異。

## 面試回答方式

先講定義，再講組成。

## 常見追問

### Function Calling 算 Agent 嗎？

**核心答案**：不一定。

**詳細解析**：關鍵在持續循環自主決策。

**面試回答方式**：先給界線，再舉例。

## 相關

- [[002-react-pattern.md]]
`;

describe("parseQuestionMarkdown", () => {
  it("maps frontmatter fields to Question", () => {
    const result = parseQuestionMarkdown(VALID_RAW, "content/ai-agent/001.md");

    expect(result).toMatchObject({
      id: "ai-agent-001",
      slug: "agent-fundamentals",
      title: "AI Agent 基本定義與核心組成",
      difficulty: "easy",
      tags: ["Agent", "基礎概念"],
      categorySlug: "ai-agent",
      content: "什麼是 AI Agent？",
      coreAnswer: "AI Agent 是以 LLM 為核心決策引擎的系統。",
      detail: "詳細說明 Agent 與單次問答的差異。",
      interviewTip: "先講定義，再講組成。",
    });
    expect(result.answer).toContain("## 核心答案");
    expect(result.followUps).toEqual([
      {
        title: "Function Calling 算 Agent 嗎？",
        coreAnswer: "不一定。",
        detail: "關鍵在持續循環自主決策。",
        interviewTip: "先給界線，再舉例。",
      },
    ]);
    expect(result.related).toEqual(["[[002-react-pattern.md]]"]);
  });

  it("splits content and answer at headings", () => {
    const result = parseQuestionMarkdown(VALID_RAW, "test.md");

    expect(result.content).toBe("什麼是 AI Agent？");
    expect(result.coreAnswer).toContain("AI Agent 是以 LLM 為核心決策引擎的系統。");
    expect(result.answer).toContain("## 核心答案");
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
