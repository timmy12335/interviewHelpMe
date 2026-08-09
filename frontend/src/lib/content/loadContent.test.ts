import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import type { CategoryMeta } from "./categories";
import {
  getAllCategoriesFromRoot,
  getAllQuestionsFromRoot,
  getContentRoot,
  getQuestionFromRoot,
  getQuestionsByCategoryFromRoot,
} from "./loadContent";

const FIXTURE_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "valid",
);
const MISMATCH_FIXTURE_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "category-mismatch",
);

const FIXTURE_META: CategoryMeta[] = [
  { slug: "sample-cat", nameZh: "測試分類", sortOrder: 1 },
];

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function createTempContentRoot(entries: Record<string, string[]>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "load-content-test-"));
  tempDirs.push(dir);

  for (const [slug, files] of Object.entries(entries)) {
    const categoryDir = path.join(dir, slug);
    fs.mkdirSync(categoryDir, { recursive: true });

    for (const fileName of files) {
      fs.writeFileSync(
        path.join(categoryDir, fileName),
        `---\nid: ${slug}-001\ncategory: ${slug}\nslug: sample\ntitle: 測試\ndifficulty: easy\ntags: []\n---\n\n# 題目\n`,
        "utf-8",
      );
    }
  }

  return dir;
}

describe("loadContent", () => {
  it("getContentRoot resolves to repo content directory", () => {
    expect(getContentRoot()).toBe(path.resolve(process.cwd(), "..", "content"));
  });

  it("throws when content root directory does not exist", () => {
    const missingRoot = path.join(os.tmpdir(), "missing-content-root-load-content-test");

    expect(() => getAllCategoriesFromRoot(missingRoot, FIXTURE_META)).toThrow(
      /Content root directory not found/,
    );
  });

  it("throws when CATEGORY_META slug has no matching directory", () => {
    const contentRoot = createTempContentRoot({});

    expect(() => getAllCategoriesFromRoot(contentRoot, FIXTURE_META)).toThrow(
      /missing directories: sample-cat/,
    );
  });

  it("throws when content root has unexpected category directories", () => {
    const contentRoot = createTempContentRoot({
      "sample-cat": ["001-sample.md"],
      "extra-cat": ["001-extra.md"],
    });

    expect(() => getAllCategoriesFromRoot(contentRoot, FIXTURE_META)).toThrow(
      /unexpected directories: extra-cat/,
    );
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
      getQuestionsByCategoryFromRoot(MISMATCH_FIXTURE_ROOT, "wrong-cat"),
    ).toThrow(/wrong-cat/);
  });
});
