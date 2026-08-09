import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { sampleQuestion } from "@/components/_fixtures/questions";

import { PracticeQuestion } from "./index";

afterEach(cleanup);

describe("PracticeQuestion", () => {
  it("預設隱藏推薦答案", () => {
    render(<PracticeQuestion question={sampleQuestion} />);

    expect(
      screen.queryByRole("heading", { name: "推薦答案" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/比較參考是否相同/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "顯示推薦答案" }),
    ).toBeInTheDocument();
  });

  it("點擊按鈕可切換顯示與隱藏推薦答案", async () => {
    const user = userEvent.setup();

    render(<PracticeQuestion question={sampleQuestion} />);

    await user.click(screen.getByRole("button", { name: "顯示推薦答案" }));

    expect(
      screen.getByRole("heading", { name: "推薦答案" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/比較參考是否相同/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "隱藏推薦答案" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "隱藏推薦答案" }));

    expect(
      screen.queryByRole("heading", { name: "推薦答案" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "顯示推薦答案" }),
    ).toBeInTheDocument();
  });
});
