import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { sampleQuestion } from "@/components/_fixtures/questions";
import type { Question } from "@/types/question";

import { BilingualQuestion, localizeQuestion } from "./index";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const bilingual: Question = {
  ...sampleQuestion,
  en: {
    title: "English title",
    content: "English question body",
    coreAnswer: "English core answer",
  },
};

describe("BilingualQuestion", () => {
  it("沒有譯本的題目不顯示語言切換", () => {
    render(<BilingualQuestion question={sampleQuestion} />);

    expect(screen.queryByRole("button", { name: "English" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: sampleQuestion.title })).toBeInTheDocument();
  });

  it("預設顯示中文，切到 English 後換成譯本並記住選擇", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<BilingualQuestion question={bilingual} />);

    expect(screen.getByRole("heading", { name: sampleQuestion.title })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByRole("heading", { name: "English title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");

    unmount();
    render(<BilingualQuestion question={bilingual} />);

    expect(await screen.findByRole("heading", { name: "English title" })).toBeInTheDocument();
  });
});

describe("localizeQuestion", () => {
  it("只覆蓋譯本有的欄位，id、難度與標籤沿用主檔", () => {
    const localized = localizeQuestion(bilingual, true);

    expect(localized.title).toBe("English title");
    expect(localized.id).toBe(sampleQuestion.id);
    expect(localized.difficulty).toBe(sampleQuestion.difficulty);
    expect(localized.tags).toEqual(sampleQuestion.tags);
    expect(localized.en).toBeUndefined();
  });

  it("選中文時原封不動回傳主檔", () => {
    expect(localizeQuestion(bilingual, false)).toBe(bilingual);
  });
});
