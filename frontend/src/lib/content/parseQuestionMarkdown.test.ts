import { describe, expect, it } from "vitest";

import { parseQuestionMarkdown, parseQuestionTranslation } from "./parseQuestionMarkdown";

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

## 講稿

我的理解是，AI Agent 是以 LLM 為核心決策引擎的系統。

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
      script: "我的理解是，AI Agent 是以 LLM 為核心決策引擎的系統。",
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

  it("splits 詳細解析 into blocks for scannable rendering", () => {
    const raw = VALID_RAW.replace(
      "詳細說明 Agent 與單次問答的差異。",
      "**自主性**：能自己決定下一步。\n\n**持續性**：不是單次問答。",
    );

    expect(parseQuestionMarkdown(raw, "test.md").detailBlocks).toEqual([
      { heading: "自主性", body: "能自己決定下一步。" },
      { heading: "持續性", body: "不是單次問答。" },
    ]);
  });

  it("leaves script undefined when the 講稿 section is absent", () => {
    const raw = VALID_RAW.replace(
      /## 講稿\n\n[^\n]+\n\n/,
      "",
    );

    expect(parseQuestionMarkdown(raw, "test.md").script).toBeUndefined();
  });

  it("keeps 講稿 out of the merged answer markdown", () => {
    const result = parseQuestionMarkdown(VALID_RAW, "test.md");

    expect(result.answer).not.toContain("## 講稿");
  });
});

describe("parseQuestionTranslation", () => {
  const EN_RAW = `---
title: What is an AI Agent?
---

# Question

What is an AI Agent?

## Core Answer

An LLM-driven decision loop.

## Detailed Explanation

**Loop**: It keeps choosing the next action.

## How to Answer

Definition first, then components.

## Script

An AI agent is a system that uses an LLM to decide what to do next.

## Follow-up Questions

### Does function calling count as an agent?

**Core answer**: Not necessarily.

**Detailed explanation**: The key is the autonomous loop.

**How to answer**: Contrast one call with a loop.
`;

  it("parses English headings and follow-up labels", () => {
    const parsed = parseQuestionTranslation(EN_RAW, "x.en.md");

    expect(parsed.title).toBe("What is an AI Agent?");
    expect(parsed.content).toBe("What is an AI Agent?");
    expect(parsed.coreAnswer).toBe("An LLM-driven decision loop.");
    expect(parsed.detailBlocks).toEqual([
      { heading: "Loop", body: "It keeps choosing the next action." },
    ]);
    expect(parsed.interviewTip).toBe("Definition first, then components.");
    expect(parsed.script).toContain("decide what to do next");
    expect(parsed.followUps).toEqual([
      {
        title: "Does function calling count as an agent?",
        coreAnswer: "Not necessarily.",
        detail: "The key is the autonomous loop.",
        interviewTip: "Contrast one call with a loop.",
      },
    ]);
    expect(parsed.answer).toContain("## Core Answer");
  });

  it("rejects a translation without a title", () => {
    expect(() =>
      parseQuestionTranslation(EN_RAW.replace("title: What is an AI Agent?\n", ""), "x.en.md"),
    ).toThrow(/title/);
  });

  it("rejects a translation that still uses Chinese headings", () => {
    expect(() => parseQuestionTranslation(VALID_RAW, "x.en.md")).toThrow(/# Question/);
  });
});
