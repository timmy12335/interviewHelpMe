import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  sampleQuestion,
  structuredQuestion,
} from "@/components/_fixtures/questions";

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

describe("PracticeQuestion 解析與講稿", () => {
  async function reveal() {
    const user = userEvent.setup();
    render(<PracticeQuestion question={structuredQuestion} />);
    await user.click(
      screen.getByRole("button", { name: /顯示核心答案與詳細解析/ }),
    );
    return user;
  }

  it("詳細解析先只露出小標，內文預設收起", async () => {
    await reveal();

    expect(
      screen.getByRole("button", { name: /推理與行動為何要交錯/ }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("只有推理會缺乏外部資訊。")).not.toBeInTheDocument();
  });

  it("點小標可以只展開那一段", async () => {
    const user = await reveal();

    await user.click(screen.getByRole("button", { name: /推理與行動為何要交錯/ }));

    expect(screen.getByText("只有推理會缺乏外部資訊。")).toBeInTheDocument();
    expect(
      screen.queryByText("讓下一輪思考建立在真實回饋上。"),
    ).not.toBeInTheDocument();
  });

  it("全部展開會攤開每一段，再按一次收回", async () => {
    const user = await reveal();

    await user.click(screen.getByRole("button", { name: "全部展開" }));

    expect(screen.getByText("只有推理會缺乏外部資訊。")).toBeInTheDocument();
    expect(screen.getByText("讓下一輪思考建立在真實回饋上。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "全部收起" }));

    expect(screen.queryByText("只有推理會缺乏外部資訊。")).not.toBeInTheDocument();
  });

  it("顯示講稿與預估的口說長度", async () => {
    await reveal();

    expect(screen.getByRole("heading", { name: /照著這樣講/ })).toBeInTheDocument();
    expect(
      screen.getByText(/我的理解是，ReAct 讓模型交替產生思考、行動與觀察。/),
    ).toBeInTheDocument();
    expect(screen.getByText(/約 \d+ 秒 · 每段換一口氣/)).toBeInTheDocument();
  });

  it("導覽列說明各分區的份量", async () => {
    await reveal();

    expect(screen.getByText("2 段 · 1 分鐘")).toBeInTheDocument();
    expect(screen.getByText("1 題")).toBeInTheDocument();
    expect(screen.getAllByText("2 段 · 1 分鐘")).toHaveLength(1);
  });

  it("沒有講稿時不顯示講稿區", async () => {
    const user = userEvent.setup();
    const { script, ...withoutScript } = structuredQuestion;
    render(<PracticeQuestion question={withoutScript} />);
    await user.click(
      screen.getByRole("button", { name: /顯示核心答案與詳細解析/ }),
    );

    expect(
      screen.queryByRole("heading", { name: /照著這樣講/ }),
    ).not.toBeInTheDocument();
  });
});
