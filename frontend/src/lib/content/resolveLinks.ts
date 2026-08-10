import { withBasePath } from "@/lib/paths";
import type { FollowUp, Question } from "@/types/question";

import {
  fallbackLabel,
  replaceWikiLinks,
  type WikiLinkResolver,
  type WikiTarget,
} from "./wikiLinks";

/** `category/slug` → 題目標題。 */
export type LinkIndex = ReadonlyMap<string, string>;

function indexKey(categorySlug: string, slug: string): string {
  return `${categorySlug}/${slug}`;
}

export function buildLinkIndex(questions: readonly Question[]): LinkIndex {
  return new Map(
    questions.map((question) => [
      indexKey(question.categorySlug, question.slug),
      question.title,
    ]),
  );
}

export function questionHref(target: WikiTarget, basePath?: string): string {
  return withBasePath(
    `/category/${target.categorySlug}/question/${target.slug}/`,
    basePath,
  );
}

/**
 * 建立 resolver：找得到目標就用題目標題當連結文字，找不到就回傳 null，
 * 由 replaceWikiLinks 保留原樣，避免產生指向不存在頁面的連結。
 */
export function createResolver(
  index: LinkIndex,
  basePath?: string,
): WikiLinkResolver {
  return (target) => {
    const title = index.get(indexKey(target.categorySlug, target.slug));
    if (!title) {
      return null;
    }

    return { href: questionHref(target, basePath), label: title };
  };
}

/**
 * 給「相關」清單用：找不到目標時仍要顯示，退回 slug 推導的標籤。
 */
export function resolveRelated(
  target: WikiTarget,
  index: LinkIndex,
  basePath?: string,
): { href: string; label: string } {
  const title = index.get(indexKey(target.categorySlug, target.slug));

  return {
    href: questionHref(target, basePath),
    label: title ?? fallbackLabel(target),
  };
}

function replaceIn(
  value: string | undefined,
  categorySlug: string,
  resolve: WikiLinkResolver,
): string | undefined {
  return value === undefined
    ? undefined
    : replaceWikiLinks(value, categorySlug, resolve);
}

function resolveFollowUp(
  followUp: FollowUp,
  categorySlug: string,
  resolve: WikiLinkResolver,
): FollowUp {
  return {
    ...followUp,
    coreAnswer: replaceIn(followUp.coreAnswer, categorySlug, resolve),
    detail: replaceIn(followUp.detail, categorySlug, resolve),
    interviewTip: replaceIn(followUp.interviewTip, categorySlug, resolve),
  };
}

/**
 * 把題目所有 Markdown 欄位裡的 `[[...]]` 換成真正的連結。
 * `related` 保持原始寫法，由元件層自行解析成標籤。
 */
export function withResolvedLinks(
  question: Question,
  index: LinkIndex,
  basePath?: string,
): Question {
  const resolve = createResolver(index, basePath);
  const { categorySlug } = question;

  return {
    ...question,
    content: replaceWikiLinks(question.content, categorySlug, resolve),
    answer: replaceIn(question.answer, categorySlug, resolve),
    coreAnswer: replaceIn(question.coreAnswer, categorySlug, resolve),
    detail: replaceIn(question.detail, categorySlug, resolve),
    interviewTip: replaceIn(question.interviewTip, categorySlug, resolve),
    followUps: question.followUps?.map((followUp) =>
      resolveFollowUp(followUp, categorySlug, resolve),
    ),
  };
}
