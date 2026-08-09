"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { ProgressRing } from "@/components/ProgressRing";
import { useProgress } from "@/hooks/useProgress";
import { isTypingTarget } from "@/lib/keyboard";
import type { QuestionListItem } from "@/types/question";

import "./index.css";

export interface QuestionSiderProps {
  categorySlug: string;
  categoryName: string;
  questions: QuestionListItem[];
  currentSlug: string;
}

/** 題庫題目側欄：題單、進度與上一題／下一題導覽（支援 J / K 快捷鍵）。 */
export function QuestionSider({
  categorySlug,
  categoryName,
  questions,
  currentSlug,
}: QuestionSiderProps) {
  const router = useRouter();
  const ids = useMemo(
    () => questions.map((question) => question.id),
    [questions],
  );
  const { answeredIds, dueIds, answeredCount, dueCount, total } =
    useProgress(ids);

  const index = questions.findIndex((item) => item.slug === currentSlug);
  const prev = index > 0 ? questions[index - 1] : undefined;
  const next =
    index >= 0 && index < questions.length - 1
      ? questions[index + 1]
      : undefined;
  const position = index >= 0 ? index + 1 : 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const target =
        key === "j" ? next : key === "k" ? prev : undefined;

      if (!target) {
        return;
      }

      event.preventDefault();
      router.push(`/category/${categorySlug}/question/${target.slug}/`);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [categorySlug, next, prev, router]);

  return (
    <aside className="q-sider" aria-label="題庫題目導覽">
      <div className="q-sider__head">
        <p className="hud-eyebrow">Module</p>
        <Link className="q-sider__title" href={`/category/${categorySlug}/`}>
          {categoryName}
        </Link>

        <div className="q-sider__stats">
          <ProgressRing
            value={answeredCount}
            total={total}
            size={40}
            due={dueCount > 0}
          />
          <div className="q-sider__stat-text">
            <span className="hud-index">
              已作答 {answeredCount} / {total}
            </span>
            {dueCount > 0 ? (
              <span className="q-sider__due-count">{dueCount} 題待複習</span>
            ) : null}
          </div>
        </div>

        <div className="q-sider__progress">
          <span className="hud-index">
            {String(position).padStart(3, "0")} /{" "}
            {String(questions.length).padStart(3, "0")}
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

        <p className="q-sider__keys">
          <kbd>J</kbd> 下一題 <kbd>K</kbd> 上一題 <kbd>A</kbd> 解鎖答案
        </p>
      </div>

      <nav className="q-sider__list" aria-label="本題庫題目">
        {questions.map((question, itemIndex) => {
          const active = question.slug === currentSlug;
          const answered = answeredIds.has(question.id);
          const due = dueIds.has(question.id);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`q-nav-item${active ? " is-active" : ""}${
                answered ? " is-answered" : ""
              }${due ? " is-due" : ""}`}
              href={`/category/${categorySlug}/question/${question.slug}/`}
              key={question.id}
            >
              <span className="q-nav-num">
                {String(itemIndex + 1).padStart(3, "0")}
              </span>
              <span className="q-nav-title">{question.title}</span>
              {due ? (
                <span className="q-nav-flag" title="建議複習">
                  !
                </span>
              ) : null}
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
