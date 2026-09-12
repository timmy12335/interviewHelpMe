import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

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

  it("不使用 dangerouslySetInnerHTML", () => {
    // 全站目前 0 處。資料雖由我們自己撰寫，仍維持這條界線，
    // 免得日後有人把外部資料接進同一個渲染器時破功。
    const source = CheatSheetView.toString();
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
