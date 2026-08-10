import fs from "node:fs";
import path from "node:path";

import type { Category, Question } from "@/types/question";

import { CATEGORY_META, type CategoryMeta } from "./categories";
import { parseQuestionMarkdown } from "./parseQuestionMarkdown";
import {
  buildLinkIndex,
  withResolvedLinks,
  type LinkIndex,
} from "./resolveLinks";

export function getContentRoot(): string {
  const root = path.resolve(process.cwd(), "..", "content");
  assertContentRootExists(root);
  return root;
}

function assertContentRootExists(contentRoot: string): void {
  if (!fs.existsSync(contentRoot)) {
    throw new Error(`Content root directory not found: ${contentRoot}`);
  }
}

function listCategoryDirectoryNames(contentRoot: string): string[] {
  return fs
    .readdirSync(contentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function assertCategoryDirectoriesMatchMeta(
  contentRoot: string,
  meta: CategoryMeta[],
): void {
  const expectedSlugs = [...meta].map(({ slug }) => slug).sort();
  const actualSlugs = listCategoryDirectoryNames(contentRoot);

  const expectedSet = new Set(expectedSlugs);
  const actualSet = new Set(actualSlugs);

  const missingInContent = expectedSlugs.filter((slug) => !actualSet.has(slug));
  const extraInContent = actualSlugs.filter((slug) => !expectedSet.has(slug));

  if (missingInContent.length === 0 && extraInContent.length === 0) {
    return;
  }

  const parts: string[] = [];
  if (missingInContent.length > 0) {
    parts.push(`missing directories: ${missingInContent.join(", ")}`);
  }
  if (extraInContent.length > 0) {
    parts.push(`unexpected directories: ${extraInContent.join(", ")}`);
  }

  throw new Error(
    `Content directory structure does not match CATEGORY_META: ${parts.join("; ")}`,
  );
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
  assertContentRootExists(contentRoot);
  assertCategoryDirectoriesMatchMeta(contentRoot, meta);

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
  assertContentRootExists(contentRoot);
  assertCategoryDirectoriesMatchMeta(contentRoot, meta);

  return [...meta]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap(({ slug }) => loadQuestionsFromCategoryDir(contentRoot, slug));
}

/**
 * 標題索引供內文的 `[[...]]` 連結解析成題目標題。
 * 建立一次要讀完整個題庫，而靜態匯出會跑數百頁，所以在單次執行內快取；
 * 開發模式不快取，否則改了 content 要重啟才看得到。
 */
let cachedLinkIndex: { root: string; index: LinkIndex } | undefined;

function getLinkIndex(contentRoot: string): LinkIndex {
  if (
    process.env.NODE_ENV !== "development" &&
    cachedLinkIndex?.root === contentRoot
  ) {
    return cachedLinkIndex.index;
  }

  const index = buildLinkIndex(getAllQuestionsFromRoot(contentRoot));
  cachedLinkIndex = { root: contentRoot, index };
  return index;
}

function resolveAll(contentRoot: string, questions: Question[]): Question[] {
  const index = getLinkIndex(contentRoot);
  return questions.map((question) => withResolvedLinks(question, index));
}

export function getAllCategories(): Category[] {
  return getAllCategoriesFromRoot(getContentRoot());
}

export function getQuestionsByCategory(categorySlug: string): Question[] {
  const root = getContentRoot();
  return resolveAll(root, getQuestionsByCategoryFromRoot(root, categorySlug));
}

export function getQuestion(
  categorySlug: string,
  questionSlug: string,
): Question | undefined {
  const root = getContentRoot();
  const question = getQuestionFromRoot(root, categorySlug, questionSlug);

  return question
    ? withResolvedLinks(question, getLinkIndex(root))
    : undefined;
}

export function getAllQuestions(): Question[] {
  const root = getContentRoot();
  return resolveAll(root, getAllQuestionsFromRoot(root));
}
