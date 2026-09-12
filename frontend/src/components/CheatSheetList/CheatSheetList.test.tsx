import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CheatSheet } from "@/data/cheatsheets/types";

import { CheatSheetList } from "./index";

afterEach(cleanup);

const sheets: CheatSheet[] = [
  {
    slug: "demo",
    title: "示範速查表",
    summary: "一句話說明",
    tags: ["標籤 A"],
    sections: [{ title: "區", blocks: [{ kind: "list", items: ["x"] }] }],
  },
];

describe("CheatSheetList", () => {
  it("顯示標題、說明與標籤", () => {
    render(<CheatSheetList sheets={sheets} />);

    expect(screen.getByText("示範速查表")).toBeInTheDocument();
    expect(screen.getByText("一句話說明")).toBeInTheDocument();
    expect(screen.getByText("標籤 A")).toBeInTheDocument();
  });

  it("連結指向該速查表的頁面", () => {
    render(<CheatSheetList sheets={sheets} />);

    expect(screen.getByRole("link", { name: /示範速查表/ })).toHaveAttribute(
      "href",
      "/cheatsheets/demo",
    );
  });

  // 標籤是手寫的，同一張卡片重複同一個標籤是自然會發生的事。
  // tag 的 key 如果取自標籤文字本身，重複時 React 會噴 duplicate key 警告。
  it("同一張卡片有重複標籤時不會產生 React key 警告", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const duplicateTagSheets: CheatSheet[] = [
      {
        ...sheets[0],
        tags: ["熱門", "熱門"],
      },
    ];

    render(<CheatSheetList sheets={duplicateTagSheets} />);

    const keyWarnings = spy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === "string" && arg.includes("same key")),
    );
    expect(keyWarnings).toEqual([]);

    spy.mockRestore();
  });
});
