import fs from "node:fs";
import path from "node:path";

import type { Category, Question } from "@/types/question";

import { CATEGORY_META, type CategoryMeta } from "./categories";
import { parseQuestionMarkdown } from "./parseQuestionMarkdown";

export function getContentRoot(): string {
  return path.resolve(process.cwd(), "..", "content");
}

function isQuestionMarkdownFile(name: string): boolean {
  return name.endsWith(".md") && name.toLowerCase() !== "readme.md";
}

function listQuestionFiles(categoryDir: string): string[] {
  if (!fs.existsSync(categoryDir)) {
    return [];
  }

  return fs
    .readdirSync(categoryDir)
    .filter(isQuestionMarkdownFile)
    .sort()
    .map((name) => path.join(categoryDir, name));
}

function loadQuestionsFromCategoryDir(contentRoot: string, categorySlug: string): Question[] {
  const categoryDir = path.join(contentRoot, categorySlug);
  const questions: Question[] = [];

  for (const filePath of listQuestionFiles(categoryDir)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const question = parseQuestionMarkdown(raw, filePath);

    if (question.categorySlug !== categorySlug) {
      throw new Error(
        `${filePath}: frontmatter category "${question.categorySlug}" does not match directory "${categorySlug}"`,
      );
    }

    questions.push(question);
  }

  return questions;
}

export function getQuestionsByCategoryFromRoot(
  contentRoot: string,
  categorySlug: string,
): Question[] {
  return loadQuestionsFromCategoryDir(contentRoot, categorySlug);
}

export function getAllCategoriesFromRoot(
  contentRoot: string,
  meta: CategoryMeta[] = CATEGORY_META,
): Category[] {
  return [...meta]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ slug, nameZh }) => ({
      slug,
      nameZh,
      questionCount: listQuestionFiles(path.join(contentRoot, slug)).length,
    }));
}

export function getQuestionFromRoot(
  contentRoot: string,
  categorySlug: string,
  questionSlug: string,
): Question | undefined {
  return getQuestionsByCategoryFromRoot(contentRoot, categorySlug).find(
    (question) => question.slug === questionSlug,
  );
}

export function getAllQuestionsFromRoot(
  contentRoot: string,
  meta: CategoryMeta[] = CATEGORY_META,
): Question[] {
  return [...meta]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap(({ slug }) => loadQuestionsFromCategoryDir(contentRoot, slug));
}

export function getAllCategories(): Category[] {
  return getAllCategoriesFromRoot(getContentRoot());
}

export function getQuestionsByCategory(categorySlug: string): Question[] {
  return getQuestionsByCategoryFromRoot(getContentRoot(), categorySlug);
}

export function getQuestion(
  categorySlug: string,
  questionSlug: string,
): Question | undefined {
  return getQuestionFromRoot(getContentRoot(), categorySlug, questionSlug);
}

export function getAllQuestions(): Question[] {
  return getAllQuestionsFromRoot(getContentRoot());
}
