import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MdViewer } from "./index";

afterEach(cleanup);

describe("MdViewer", () => {
  it("將 Markdown 標題渲染為可見的 heading", () => {
    render(<MdViewer value="# 面試答案" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "面試答案" }),
    ).toBeInTheDocument();
  });

  it("未提供內容時不顯示任何文字", () => {
    const { container } = render(<MdViewer />);

    expect(container).not.toHaveTextContent(/\S/);
  });
});
