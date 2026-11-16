"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ProgressRing } from "@/components/ProgressRing";
import { useProgress } from "@/hooks/useProgress";
import { useT } from "@/i18n/PreferencesProvider";
import { REVIEW_AFTER_DAYS } from "@/lib/progress";
import type { QuestionListItem } from "@/types/question";

import "./index.css";

export interface ModuleRoadmapProps {
  categorySlug: string;
  questions: QuestionListItem[];
}

const COLS = 6;
const CELL_W = 92;
const CELL_H = 78;
const PAD_X = 46;
const PAD_Y = 42;
const NODE_R = 15;

/** 蛇行排列：偶數列由左至右，奇數列由右至左，走起來是一條連續路徑。 */
function nodePosition(index: number) {
  const row = Math.floor(index / COLS);
  const rawCol = index % COLS;
  const col = row % 2 === 0 ? rawCol : COLS - 1 - rawCol;

  return {
    row,
    x: PAD_X + col * CELL_W,
    y: PAD_Y + row * CELL_H,
  };
}

/**
 * 題庫路線圖：以蛇行節點呈現題庫的建議練習順序。
 * 節點顏色代表難度，實心代表本機已留下作答草稿。
 */
export function ModuleRoadmap({ categorySlug, questions }: ModuleRoadmapProps) {
  const ids = useMemo(
    () => questions.map((question) => question.id),
    [questions],
  );
  const { answeredIds, dueIds, answeredCount, dueCount, total } =
    useProgress(ids);
  const t = useT();

  const rows = Math.ceil(questions.length / COLS);
  const viewWidth = PAD_X * 2 + (COLS - 1) * CELL_W;
  const viewHeight = PAD_Y * 2 + (rows - 1) * CELL_H;
  const trail = questions
    .map((_, index) => {
      const { x, y } = nodePosition(index);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");

  return (
    <section className="roadmap hud-panel hud-brackets" aria-label={t("roadmap.aria")}>
      <div className="roadmap__head">
        <div>
          <p className="hud-eyebrow">{t("roadmap.eyebrow")}</p>
          <p className="roadmap__lede">
            {t("roadmap.lede", { days: REVIEW_AFTER_DAYS })}
          </p>
        </div>
        <ProgressRing
          value={answeredCount}
          total={total}
          size={48}
          due={dueCount > 0}
        />
      </div>

      <svg
        className="roadmap__map"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        role="list"
        aria-label={t("roadmap.svgAria", { count: questions.length })}
      >
        <defs>
          <linearGradient id="roadmap-trail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--cyan)" }} />
            <stop offset="100%" style={{ stopColor: "var(--violet)" }} />
          </linearGradient>
        </defs>

        <path
          className="roadmap__trail"
          d={trail}
          stroke="url(#roadmap-trail)"
          fill="none"
        />

        {questions.map((question, index) => {
          const { x, y } = nodePosition(index);
          const answered = answeredIds.has(question.id);
          const due = dueIds.has(question.id);

          return (
            <Link
              key={question.id}
              href={`/category/${categorySlug}/question/${question.slug}/`}
              className={`roadmap__node roadmap__node--${question.difficulty}${
                answered ? " is-answered" : ""
              }${due ? " is-due" : ""}`}
              role="listitem"
            >
              <title>
                {`${index + 1}. ${question.title}${
                  due
                    ? t("roadmap.suffixDue")
                    : answered
                      ? t("roadmap.suffixDone")
                      : ""
                }`}
              </title>
              {due ? (
                <circle className="roadmap__due" cx={x} cy={y} r={NODE_R + 6} />
              ) : null}
              <circle className="roadmap__halo" cx={x} cy={y} r={NODE_R + 5} />
              <circle className="roadmap__disc" cx={x} cy={y} r={NODE_R} />
              <text className="roadmap__num" x={x} y={y + 4}>
                {index + 1}
              </text>
            </Link>
          );
        })}
      </svg>

      <ul className="roadmap__legend">
        <li className="roadmap__key roadmap__key--easy">{t("difficulty.easy")}</li>
        <li className="roadmap__key roadmap__key--medium">{t("difficulty.medium")}</li>
        <li className="roadmap__key roadmap__key--hard">{t("difficulty.hard")}</li>
        <li className="roadmap__key roadmap__key--done">{t("status.done")}</li>
        <li className="roadmap__key roadmap__key--due">{t("status.due")}</li>
      </ul>
    </section>
  );
}
