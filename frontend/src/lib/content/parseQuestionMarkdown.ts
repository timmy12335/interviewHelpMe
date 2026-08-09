import matter from "gray-matter";
import type { Difficulty, FollowUp, Question } from "@/types/question";

const DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);

const SECTION_HEADINGS = [
  "核心答案",
  "詳細解析",
  "面試回答方式",
  "常見追問",
  "相關",
] as const;

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

function parseLabeledBlocks(text: string): {
  core?: string;
  detail?: string;
  tip?: string;
} {
  const labels = [
    { key: "core" as const, re: /\*\*核心答案\*\*[：:]\s*/ },
    { key: "detail" as const, re: /\*\*詳細解析\*\*[：:]\s*/ },
    { key: "tip" as const, re: /\*\*面試回答方式\*\*[：:]\s*/ },
  ];

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

function parseFollowUps(raw: string): FollowUp[] {
  if (!raw.trim()) {
    return [];
  }

  const parts = raw.split(/^### /m).map((part) => part.trim()).filter(Boolean);

  return parts.map((part) => {
    const newline = part.indexOf("\n");
    const title = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = newline === -1 ? "" : part.slice(newline + 1).trim();
    const labeled = parseLabeledBlocks(body);

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
  const questionHeading = /^# 題目\s*$/m;
  const answerHeading = /^## 核心答案\s*$/m;

  if (!questionHeading.test(body)) {
    throw new Error(`${filePathForErrors}: missing "# 題目" heading`);
  }
  if (!answerHeading.test(body)) {
    throw new Error(`${filePathForErrors}: missing "## 核心答案" heading`);
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
  const coreAnswer = sections.get("核心答案")?.trim() || undefined;
  const detail = sections.get("詳細解析")?.trim() || undefined;
  const interviewTip = sections.get("面試回答方式")?.trim() || undefined;
  const followUps = parseFollowUps(sections.get("常見追問") ?? "");
  const related = parseRelated(sections.get("相關") ?? "");

  const answerParts: string[] = [];
  for (const name of SECTION_HEADINGS) {
    if (name === "常見追問" || name === "相關") {
      continue;
    }
    const value = sections.get(name);
    if (value) {
      answerParts.push(`## ${name}\n\n${value}`);
    }
  }
  const answer = answerParts.length > 0 ? answerParts.join("\n\n") : fromAnswer;

  return {
    id: fm.id as string,
    slug: fm.slug as string,
    title: fm.title as string,
    difficulty: fm.difficulty as Difficulty,
    tags,
    content,
    answer,
    coreAnswer,
    detail,
    interviewTip,
    followUps: followUps.length > 0 ? followUps : undefined,
    related: related.length > 0 ? related : undefined,
    categorySlug: fm.category as string,
  };
}
