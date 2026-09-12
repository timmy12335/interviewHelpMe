import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CheatSheetRelated } from "./index";

afterEach(cleanup);

describe("CheatSheetRelated", () => {
  it("沒有 relatedQuestions 時不渲染任何東西", () => {
    const { container } = render(<CheatSheetRelated />);
    expect(container).toBeEmptyDOMElement();
  });

  it("列出每一個 relatedQuestions 項目並連到題目頁", () => {
    render(<CheatSheetRelated relatedQuestions={["system-design/flash-sale-design"]} />);

    expect(
      screen.getByRole("link", { name: "system-design/flash-sale-design" }),
    ).toHaveAttribute("href", "/category/system-design/question/flash-sale-design");
  });

  // relatedQuestions 是手寫陣列，同一張表寫錯貼成兩個一樣的 ref 是很自然會犯的
  // 錯誤（也是 cheatSheets.test.ts 另外把關的內容錯誤）。如果 key 取自 ref 本身，
  // 重複時 React 會噴 duplicate key 警告，畫面看起來仍然正常。
  it("relatedQuestions 有重複項目時不會產生 React key 警告", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <CheatSheetRelated
        relatedQuestions={["system-design/flash-sale-design", "system-design/flash-sale-design"]}
      />,
    );

    const keyWarnings = spy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === "string" && arg.includes("same key")),
    );
    expect(keyWarnings).toEqual([]);

    spy.mockRestore();
  });
});
