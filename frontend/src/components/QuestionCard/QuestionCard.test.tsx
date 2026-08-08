import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  sampleQuestion,
  sampleQuestions,
} from "@/components/_fixtures/questions";

import { QuestionCard } from "./index";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("QuestionCard", () => {
  it("預設顯示題目資料、內容與推薦答案", () => {
    render(<QuestionCard question={sampleQuestion} />);

    expect(
      screen.getByRole("heading", {
        name: "Java 中 == 與 equals 有什麼差異？",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("簡單")).toBeInTheDocument();
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.getByText("字串")).toBeInTheDocument();
    expect(screen.getByText("==", { selector: "code" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "推薦答案" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("equals", { selector: "code" }),
    ).toBeInTheDocument();
  });

  it("提供 href 時讓題目標題成為連結", () => {
    render(<QuestionCard question={sampleQuestion} href="/questions/java" />);

    expect(
      screen.getByRole("link", {
        name: "Java 中 == 與 equals 有什麼差異？",
      }),
    ).toHaveAttribute("href", "/questions/java");
  });

  it("練習模式隱藏推薦答案但保留題目內容", () => {
    render(<QuestionCard question={sampleQuestion} showAnswer={false} />);

    expect(screen.queryByText("推薦答案")).not.toBeInTheDocument();
    expect(
      screen.queryByText("equals", { selector: "code" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("==", { selector: "code" })).toBeInTheDocument();
  });

  it("題目沒有答案時不顯示空的推薦答案區塊", () => {
    render(<QuestionCard question={sampleQuestions[1]} />);

    expect(screen.queryByText("推薦答案")).not.toBeInTheDocument();
  });

  it("掛載時不發出 API 請求", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<QuestionCard question={sampleQuestion} />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
