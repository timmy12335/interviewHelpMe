import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  manyTagsQuestion,
  sampleQuestions,
} from "@/components/_fixtures/questions";

import { QuestionList } from "./index";

afterEach(cleanup);

describe("QuestionList", () => {
  it("renders the default title, question links, difficulties, and tags", () => {
    render(<QuestionList questions={sampleQuestions} />);

    expect(screen.getByText("題目列表")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Java 中 == 與 equals 有什麼差異？",
      }),
    ).toHaveAttribute(
      "href",
      "/category/java/question/java-string-equality/",
    );
    expect(screen.getByText("簡單")).toBeInTheDocument();
    expect(screen.getAllByText("Java")).toHaveLength(2);
  });

  it("limits each question to three visible tags", () => {
    render(<QuestionList questions={[manyTagsQuestion]} />);

    expect(screen.getByText("System Design")).toBeInTheDocument();
    expect(screen.getByText("Distributed Systems")).toBeInTheDocument();
    expect(screen.getByText("CAP")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(screen.queryByText("Consistency")).not.toBeInTheDocument();
  });

  it("uses custom title and href builder", () => {
    render(
      <QuestionList
        questions={[sampleQuestions[0]]}
        title="精選題目"
        getHref={(question) => `/questions/${question.slug}`}
      />,
    );

    expect(screen.getByText("精選題目")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Java 中 == 與 equals 有什麼差異？",
      }),
    ).toHaveAttribute("href", "/questions/java-string-equality");
  });

  it("renders the default empty state when there are no questions", () => {
    render(<QuestionList questions={[]} />);

    expect(screen.getByText("題目列表")).toBeInTheDocument();
    expect(screen.getByText("尚無題目")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders a custom empty message", () => {
    render(<QuestionList questions={[]} emptyText="目前沒有符合條件的題目" />);

    expect(screen.getByText("目前沒有符合條件的題目")).toBeInTheDocument();
  });
});
