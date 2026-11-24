import matter from "gray-matter";
import type {
  ContentLocale,
  Difficulty,
  FollowUp,
  Question,
  QuestionTranslation,
} from "@/types/question";

import { splitDetailBlocks } from "./detailBlocks";

const DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);

/**
 * 各語言版本的區塊標題。中文是主檔，英文是同目錄下的 `NNN-slug.en.md` 譯本，
 * 兩者結構相同、只有標題文字不同，所以共用同一套解析流程。
 */
export const SECTION_HEADINGS = {
  zh: {
    question: "題目",
    core: "核心答案",
    detail: "詳細解析",
    tip: "面試回答方式",
    script: "講稿",
    followUps: "常見追問",
    related: "相關",
  },
  en: {
    question: "Question",
    core: "Core Answer",
    detail: "Detailed Explanation",
    tip: "How to Answer",
    script: "Script",
    followUps: "Follow-up Questions",
    related: "Related",
  },
} as const satisfies Record<ContentLocale, Record<string, string>>;

/** 常見追問裡的 `**標籤**：` 前綴。 */
const FOLLOW_UP_LABELS = {
  zh: { core: "核心答案", detail: "詳細解析", tip: "面試回答方式" },
  en: { core: "Core answer", detail: "Detailed explanation", tip: "How to answer" },
} as const satisfies Record<ContentLocale, Record<string, string>>;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitByH2(body: string): Map<string, string> {
  const map = new Map<string, string>();
  const headingRe = /^## (.+)\s*$/gm;
  const matches = [...body.matchAll(headingRe)];

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const title = match[1].trim();
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    map.set(title, body.slice(start, end).trim());
  }

  return map;
}

function parseLabeledBlocks(
  text: string,
  locale: ContentLocale,
): {
  core?: string;
  detail?: string;
  tip?: string;
} {
  const names = FOLLOW_UP_LABELS[locale];
  const labels = (["core", "detail", "tip"] as const).map((key) => ({
    key,
    re: new RegExp(`\\*\\*${escapeRegExp(names[key])}\\*\\*[：:]\\s*`),
  }));

  const positions = labels
    .map(({ key, re }) => {
      const match = text.match(re);
      if (!match || match.index === undefined) {
        return null;
      }
      return { key, index: match.index, length: match[0].length };
    })
    .filter((item): item is { key: "core" | "detail" | "tip"; index: number; length: number } =>
      Boolean(item),
    )
    .sort((a, b) => a.index - b.index);

  const result: { core?: string; detail?: string; tip?: string } = {};

  for (let i = 0; i < positions.length; i += 1) {
    const current = positions[i];
    const start = current.index + current.length;
    const end = i + 1 < positions.length ? positions[i + 1].index : text.length;
    result[current.key] = text.slice(start, end).trim();
  }

  return result;
}

function parseFollowUps(raw: string, locale: ContentLocale): FollowUp[] {
  if (!raw.trim()) {
    return [];
  }

  const parts = raw.split(/^### /m).map((part) => part.trim()).filter(Boolean);

  return parts.map((part) => {
    const newline = part.indexOf("\n");
    const title = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1).trim();
    const labeled = parseLabeledBlocks(body, locale);

    return {
      title,
      coreAnswer: labeled.core,
      detail: labeled.detail,
      interviewTip: labeled.tip,
    };
  });
}

function parseRelated(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean);
}

type ParsedBody = Pick<
  Question,
  | "content"
  | "answer"
  | "coreAnswer"
  | "detail"
  | "detailBlocks"
  | "interviewTip"
  | "script"
  | "followUps"
  | "related"
>;

function parseBody(body: string, locale: ContentLocale, filePathForErrors: string): ParsedBody {
  const h = SECTION_HEADINGS[locale];
  const questionHeading = new RegExp(`^# ${escapeRegExp(h.question)}\\s*$`, "m");
  const answerHeading = new RegExp(`^## ${escapeRegExp(h.core)}\\s*$`, "m");

  if (!questionHeading.test(body)) {
    throw new Error(`${filePathForErrors}: missing "# ${h.question}" heading`);
  }
  if (!answerHeading.test(body)) {
    throw new Error(`${filePathForErrors}: missing "## ${h.core}" heading`);
  }

  const answerMatch = body.match(answerHeading)!;
  const beforeAnswer = body.slice(0, answerMatch.index);
  const fromAnswer = body.slice(answerMatch.index!).trim();
  const questionMatch = beforeAnswer.match(questionHeading)!;
  const content = beforeAnswer.slice(questionMatch.index! + questionMatch[0].length).trim();

  if (!content) {
    throw new Error(`${filePathForErrors}: empty question content`);
  }

  const sections = splitByH2(fromAnswer);
  const coreAnswer = sections.get(h.core)?.trim() || undefined;
  const detail = sections.get(h.detail)?.trim() || undefined;
  const interviewTip = sections.get(h.tip)?.trim() || undefined;
  const script = sections.get(h.script)?.trim() || undefined;
  const followUps = parseFollowUps(sections.get(h.followUps) ?? "", locale);
  const related = parseRelated(sections.get(h.related) ?? "");

  // 講稿是獨立呈現的逐字稿，混進合併 markdown 只會讓舊版面重複同一段話；
  // 常見追問與相關也各有自己的版面。
  const answerParts: string[] = [];
  for (const name of [h.core, h.detail, h.tip]) {
    const value = sections.get(name);
    if (value) {
      answerParts.push(`## ${name}\n\n${value}`);
    }
  }
  const answer = answerParts.length > 0 ? answerParts.join("\n\n") : fromAnswer;

  return {
    content,
    answer,
    coreAnswer,
    detail,
    detailBlocks: splitDetailBlocks(detail),
    interviewTip,
    script,
    followUps: followUps.length > 0 ? followUps : undefined,
    related: related.length > 0 ? related : undefined,
  };
}

export function parseQuestionMarkdown(raw: string, filePathForErrors: string): Question {
  const { data, content: body } = matter(raw);
  const fm = data as Record<string, unknown>;

  for (const key of ["id", "category", "slug", "title", "difficulty"] as const) {
    if (!fm[key] || typeof fm[key] !== "string") {
      throw new Error(`${filePathForErrors}: missing or invalid frontmatter "${key}"`);
    }
  }

  if (!DIFFICULTIES.has(fm.difficulty as Difficulty)) {
    throw new Error(`${filePathForErrors}: invalid difficulty "${String(fm.difficulty)}"`);
  }

  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];

  return {
    id: fm.id as string,
    slug: fm.slug as string,
    title: fm.title as string,
    difficulty: fm.difficulty as Difficulty,
    tags,
    ...parseBody(body, "zh", filePathForErrors),
    categorySlug: fm.category as string,
  };
}

/**
 * 解析英文譯本 `NNN-slug.en.md`。
 * 譯本只帶標題與內文；id、難度、標籤、相關題目都以中文主檔為準，避免兩邊漂移。
 */
export function parseQuestionTranslation(
  raw: string,
  filePathForErrors: string,
): QuestionTranslation {
  const { data, content: body } = matter(raw);
  const fm = data as Record<string, unknown>;

  if (!fm.title || typeof fm.title !== "string") {
    throw new Error(`${filePathForErrors}: missing or invalid frontmatter "title"`);
  }

  const { related: _related, ...parsed } = parseBody(body, "en", filePathForErrors);

  return { title: fm.title, ...parsed };
}
