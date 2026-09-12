import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CheatSheet } from "@/data/cheatsheets/types";

import { CheatSheetView } from "./index";

afterEach(cleanup);

const sheet: CheatSheet = {
  slug: "demo",
  title: "示範速查表",
  summary: "一句話說明",
  tags: ["標籤 A"],
  sections: [
    {
      title: "第一區",
      accent: "cyan",
      blocks: [{ kind: "list", items: ["重點一"] }],
    },
  ],
};

describe("CheatSheetView", () => {
  it("顯示標題、區塊標題與區塊內容", () => {
    render(<CheatSheetView sheet={sheet} />);

    expect(screen.getByRole("heading", { name: "示範速查表" })).toBeInTheDocument();
    expect(screen.getByText("第一區")).toBeInTheDocument();
    expect(screen.getByText("重點一")).toBeInTheDocument();
  });

  // 「不得繞過 React 直接注入 HTML」的規則移到 src/test/noDangerouslySetInnerHtml.test.ts：
  // 這裡只看得到 CheatSheetView 自己的原始碼，看不進它呼叫的 BlockRenderer 與原語元件。

  // 手寫的速查表資料會出現兩個分區同名（例如都叫「注意事項」）。
  // section 的 key 如果取自 section.title 本身，React 會在主控台噴
  // duplicate key 警告，畫面看起來仍然正常，只有主控台看得出來。
  it("兩個分區同名時不會產生 React key 警告", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const duplicateSheet: CheatSheet = {
      ...sheet,
      sections: [
        { title: "注意事項", accent: "amber", blocks: [{ kind: "list", items: ["第一點"] }] },
        { title: "注意事項", accent: "rose", blocks: [{ kind: "list", items: ["第二點"] }] },
      ],
    };

    render(<CheatSheetView sheet={duplicateSheet} />);

    const keyWarnings = spy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === "string" && arg.includes("same key")),
    );
    expect(keyWarnings).toEqual([]);

    spy.mockRestore();
  });
});
