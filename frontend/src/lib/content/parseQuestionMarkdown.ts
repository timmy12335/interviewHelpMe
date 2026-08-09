import matter from "gray-matter";
import type { Difficulty, Question } from "@/types/question";

const DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);

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
  const answer = body.slice(answerMatch.index!).trim();
  const questionMatch = beforeAnswer.match(questionHeading)!;
  const content = beforeAnswer.slice(questionMatch.index! + questionMatch[0].length).trim();

  if (!content) {
    throw new Error(`${filePathForErrors}: empty question content`);
  }

  return {
    id: fm.id as string,
    slug: fm.slug as string,
    title: fm.title as string,
    difficulty: fm.difficulty as Difficulty,
    tags,
    content,
    answer,
    categorySlug: fm.category as string,
  };
}
