import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { sampleQuestion } from "@/components/_fixtures/questions";

import { PracticeQuestion } from "./index";

afterEach(cleanup);

describe("PracticeQuestion", () => {
  it("預設隱藏答案並顯示作答框", () => {
    render(<PracticeQuestion question={sampleQuestion} />);

    expect(screen.getByLabelText("你的作答（先想再看答案）")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "核心答案" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/比較參考是否相同/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /顯示核心答案與詳細解析/ }),
    ).toBeInTheDocument();
  });

  it("點擊按鈕可切換顯示與隱藏答案分區", async () => {
    const user = userEvent.setup();

    render(<PracticeQuestion question={sampleQuestion} />);

    await user.click(
      screen.getByRole("button", { name: /顯示核心答案與詳細解析/ }),
    );

    expect(screen.getByRole("heading", { name: "核心答案" })).toBeInTheDocument();
    expect(screen.getByText(/比較參考是否相同/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /隱藏核心答案與詳細解析/ }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /隱藏核心答案與詳細解析/ }),
    );

    expect(
      screen.queryByRole("heading", { name: "核心答案" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /顯示核心答案與詳細解析/ }),
    ).toBeInTheDocument();
  });
});
