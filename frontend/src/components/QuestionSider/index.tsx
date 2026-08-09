"use client";

import Link from "next/link";

import type { QuestionListItem } from "@/types/question";

import "./index.css";

export interface QuestionSiderProps {
  categorySlug: string;
  categoryName: string;
  questions: QuestionListItem[];
  currentSlug: string;
}

/** 題庫題目側欄：題單、進度與上一題／下一題導覽。 */
export function QuestionSider({
  categorySlug,
  categoryName,
  questions,
  currentSlug,
}: QuestionSiderProps) {
  const index = questions.findIndex((item) => item.slug === currentSlug);
  const prev = index > 0 ? questions[index - 1] : undefined;
  const next =
    index >= 0 && index < questions.length - 1
      ? questions[index + 1]
      : undefined;
  const position = index >= 0 ? index + 1 : 0;

  return (
    <aside className="q-sider" aria-label="題庫題目導覽">
      <div className="q-sider__head">
        <p className="hud-eyebrow">Module</p>
        <Link className="q-sider__title" href={`/category/${categorySlug}/`}>
          {categoryName}
        </Link>
        <div className="q-sider__progress">
          <span className="hud-index">
            {String(position).padStart(3, "0")} / {String(questions.length).padStart(3, "0")}
          </span>
          <span className="q-sider__bar" aria-hidden>
            <span
              className="q-sider__bar-fill"
              style={{
                transform: `scaleX(${questions.length ? position / questions.length : 0})`,
              }}
            />
          </span>
        </div>
        <div className="q-sider__pager">
          {prev ? (
            <Link
              className="q-pager"
              href={`/category/${categorySlug}/question/${prev.slug}/`}
            >
              ← 上一題
            </Link>
          ) : (
            <span className="q-pager is-disabled">← 上一題</span>
          )}
          {next ? (
            <Link
              className="q-pager"
              href={`/category/${categorySlug}/question/${next.slug}/`}
            >
              下一題 →
            </Link>
          ) : (
            <span className="q-pager is-disabled">下一題 →</span>
          )}
        </div>
      </div>

      <nav className="q-sider__list" aria-label="本題庫題目">
        {questions.map((question, itemIndex) => {
          const active = question.slug === currentSlug;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`q-nav-item${active ? " is-active" : ""}`}
              href={`/category/${categorySlug}/question/${question.slug}/`}
              key={question.id}
            >
              <span className="q-nav-num">
                {String(itemIndex + 1).padStart(3, "0")}
              </span>
              <span className="q-nav-title">{question.title}</span>
              <span
                className={`q-dot q-dot--${question.difficulty}`}
                aria-hidden
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
