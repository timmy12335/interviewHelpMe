import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

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
});
