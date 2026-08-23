import { withBasePath } from "@/lib/paths";
import type { FollowUp, Question } from "@/types/question";

import type { DetailBlock } from "@/types/question";

import { emphasizeQuotedPhrases } from "./emphasizeQuotes";
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

/** 面試回答方式額外把「」短句轉成粗體，讓「要講的話」在總結卡裡跳出來。 */
function resolveTip(
  value: string | undefined,
  categorySlug: string,
  resolve: WikiLinkResolver,
): string | undefined {
  const linked = replaceIn(value, categorySlug, resolve);
  return linked === undefined ? undefined : emphasizeQuotedPhrases(linked);
}

/**
 * 詳細解析的小塊各自渲染，連結必須在這裡解析，
 * 否則畫面上會直接出現沒被換掉的 `[[...]]`。
 */
function resolveDetailBlocks(
  blocks: readonly DetailBlock[] | undefined,
  categorySlug: string,
  resolve: WikiLinkResolver,
): DetailBlock[] | undefined {
  return blocks?.map((block) => ({
    ...block,
    body: replaceWikiLinks(block.body, categorySlug, resolve),
  }));
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
    interviewTip: resolveTip(followUp.interviewTip, categorySlug, resolve),
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
    detailBlocks: resolveDetailBlocks(question.detailBlocks, categorySlug, resolve),
    interviewTip: resolveTip(question.interviewTip, categorySlug, resolve),
    // 講稿是要照著念的，不套用「」轉粗體：唸稿版面靠字級與斷句分層，
    // 再灑一層粗體只會讓視線在跟稿時被打斷。
    script: replaceIn(question.script, categorySlug, resolve),
    followUps: question.followUps?.map((followUp) =>
      resolveFollowUp(followUp, categorySlug, resolve),
    ),
  };
}
