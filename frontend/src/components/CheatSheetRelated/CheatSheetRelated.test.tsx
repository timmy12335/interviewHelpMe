import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RelatedQuestionLink } from "@/lib/content/relatedQuestions";

import { CheatSheetRelated } from "./index";

afterEach(cleanup);

const flashSale: RelatedQuestionLink = {
  href: "/category/system-design/question/flash-sale-design/",
  title: "如何設計一個秒殺系統？",
  category: "系統設計",
};

describe("CheatSheetRelated", () => {
  it("沒有項目時不渲染任何東西", () => {
    const { container } = render(<CheatSheetRelated />);
    expect(container).toBeEmptyDOMElement();
  });

  it("空陣列時也不渲染任何東西", () => {
    const { container } = render(<CheatSheetRelated items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  // 顯示 slug 的話讀者得先猜那是哪一題才會點；標題才是可掃視的資訊。
  it("顯示題目標題與分類，而不是原始 slug", () => {
    render(<CheatSheetRelated items={[flashSale]} />);

    expect(screen.getByText("如何設計一個秒殺系統？")).toBeInTheDocument();
    expect(screen.getByText("系統設計")).toBeInTheDocument();
    expect(screen.queryByText(/flash-sale-design/)).not.toBeInTheDocument();
  });

  // next/link 會正規化 href，尾斜線在測試環境下會被去掉（實際站台由
  // trailingSlash: true 補回來），所以這裡比對路徑本身而非逐字元相等。
  it("連到對應的題目頁", () => {
    render(<CheatSheetRelated items={[flashSale]} />);

    const href = screen
      .getByRole("link", { name: /如何設計一個秒殺系統/ })
      .getAttribute("href");

    expect(href?.replace(/\/$/, "")).toBe("/category/system-design/question/flash-sale-design");
  });

  // items 由 relatedQuestions 解析而來，而 relatedQuestions 是手寫陣列，
  // 同一張表貼成兩個一樣的 ref 是很自然會犯的錯。如果 key 取自內容本身，
  // 重複時 React 會噴 duplicate key 警告，而畫面看起來仍然正常。
  it("項目重複時不會產生 React key 警告", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<CheatSheetRelated items={[flashSale, flashSale]} />);

    const keyWarnings = spy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === "string" && arg.includes("same key")),
    );
    expect(keyWarnings).toEqual([]);

    spy.mockRestore();
  });
});
