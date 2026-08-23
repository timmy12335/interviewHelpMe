import { describe, expect, it } from "vitest";

import { buildLinkIndex, withResolvedLinks } from "./resolveLinks";
import type { Question } from "@/types/question";

const target: Question = {
  id: "ai-agent-002",
  slug: "react-pattern",
  title: "ReAct 模式",
  difficulty: "easy",
  tags: [],
  content: "內容",
  categorySlug: "ai-agent",
};

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: "ai-agent-001",
    slug: "agent-fundamentals",
    title: "Agent 基本定義",
    difficulty: "easy",
    tags: [],
    content: "內容",
    categorySlug: "ai-agent",
    ...overrides,
  };
}

const index = buildLinkIndex([target]);

describe("withResolvedLinks", () => {
  it("resolves wiki links inside each detail block", () => {
    const resolved = withResolvedLinks(
      makeQuestion({
        detailBlocks: [{ heading: "小標", body: "見 [[002-react-pattern.md]]" }],
      }),
      index,
    );

    expect(resolved.detailBlocks?.[0].body).toContain("[ReAct 模式]");
    expect(resolved.detailBlocks?.[0].body).not.toContain("[[");
  });

  it("keeps the detail block heading untouched", () => {
    const resolved = withResolvedLinks(
      makeQuestion({ detailBlocks: [{ heading: "小標", body: "內文" }] }),
      index,
    );

    expect(resolved.detailBlocks?.[0].heading).toBe("小標");
  });

  it("resolves wiki links inside the script", () => {
    const resolved = withResolvedLinks(
      makeQuestion({ script: "如同 [[002-react-pattern.md]] 提到的" }),
      index,
    );

    expect(resolved.script).toContain("[ReAct 模式]");
  });

  it("does not bold quoted phrases in the script", () => {
    const resolved = withResolvedLinks(
      makeQuestion({ script: "我的理解是「這是一句話」。" }),
      index,
    );

    expect(resolved.script).toBe("我的理解是「這是一句話」。");
  });

  it("still bolds quoted phrases in the interview tip", () => {
    const resolved = withResolvedLinks(
      makeQuestion({ interviewTip: "先講「這句話」。" }),
      index,
    );

    expect(resolved.interviewTip).toBe("先講「**這句話**」。");
  });
});
