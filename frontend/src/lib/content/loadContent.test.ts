import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { CategoryMeta } from "./categories";
import {
  getAllCategoriesFromRoot,
  getAllQuestionsFromRoot,
  getContentRoot,
  getQuestionFromRoot,
  getQuestionsByCategoryFromRoot,
} from "./loadContent";

const FIXTURE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "__fixtures__");

const FIXTURE_META: CategoryMeta[] = [
  { slug: "sample-cat", nameZh: "測試分類", sortOrder: 1 },
];

describe("loadContent", () => {
  it("getContentRoot resolves to repo content directory", () => {
    expect(getContentRoot()).toBe(path.resolve(process.cwd(), "..", "content"));
  });

  it("getAllCategoriesFromRoot returns categories with question counts", () => {
    const categories = getAllCategoriesFromRoot(FIXTURE_ROOT, FIXTURE_META);

    expect(categories).toEqual([
      { slug: "sample-cat", nameZh: "測試分類", questionCount: 1 },
    ]);
  });

  it("getQuestionsByCategoryFromRoot returns parsed questions", () => {
    const questions = getQuestionsByCategoryFromRoot(FIXTURE_ROOT, "sample-cat");

    expect(questions).toHaveLength(1);
    expect(questions[0]).toMatchObject({
      slug: "sample-question",
      title: "範例題目",
      categorySlug: "sample-cat",
    });
  });

  it("getQuestionFromRoot finds a question by slug", () => {
    const question = getQuestionFromRoot(FIXTURE_ROOT, "sample-cat", "sample-question");

    expect(question).toMatchObject({
      slug: "sample-question",
      title: "範例題目",
    });
  });

  it("getAllQuestionsFromRoot returns all questions", () => {
    const questions = getAllQuestionsFromRoot(FIXTURE_ROOT, FIXTURE_META);

    expect(questions).toHaveLength(1);
    expect(questions[0].slug).toBe("sample-question");
  });

  it("skips README.md in category directories", () => {
    const questions = getQuestionsByCategoryFromRoot(FIXTURE_ROOT, "sample-cat");

    expect(questions.every((q) => q.slug !== "readme")).toBe(true);
  });

  it("throws when frontmatter category does not match directory name", () => {
    expect(() =>
      getQuestionsByCategoryFromRoot(FIXTURE_ROOT, "wrong-cat"),
    ).toThrow(/wrong-cat/);
  });
});
