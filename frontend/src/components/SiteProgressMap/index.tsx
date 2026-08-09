"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ProgressRing } from "@/components/ProgressRing";
import { useProgress } from "@/hooks/useProgress";
import type { ModuleSummary } from "@/lib/content/modules";

import "./index.css";

export interface SiteProgressMapProps {
  modules: ModuleSummary[];
}

/**
 * 全站學習地圖：每個題庫一列，每題一格。
 * 格子狀態＝未作答／已作答／待複習，點擊直接跳到該題。
 */
export function SiteProgressMap({ modules }: SiteProgressMapProps) {
  const allIds = useMemo(
    () => modules.flatMap((module) => module.units.map((unit) => unit.id)),
    [modules],
  );
  const { answeredIds, dueIds, answeredCount, dueCount, total, ready } =
    useProgress(allIds);

  return (
    <section className="site-map hud-panel hud-brackets" aria-label="全站學習地圖">
      <div className="site-map__head">
        <div>
          <p className="hud-eyebrow">Progress // 學習地圖</p>
          <p className="site-map__lede">
            {ready
              ? `已作答 ${answeredCount} / ${total} 題${dueCount ? `，${dueCount} 題待複習` : ""}。進度只存在這台裝置。`
              : "讀取本機進度中…"}
          </p>
        </div>
        <ProgressRing
          value={answeredCount}
          total={total}
          size={52}
          due={dueCount > 0}
        />
      </div>

      <ul className="site-map__list">
        {modules.map((module) => {
          const done = module.units.filter((unit) =>
            answeredIds.has(unit.id),
          ).length;

          return (
            <li className="site-map__row" key={module.slug}>
              <Link className="site-map__name" href={`/category/${module.slug}/`}>
                {module.nameZh}
              </Link>
              <div className="site-map__cells">
                {module.units.map((unit, index) => {
                  const answered = answeredIds.has(unit.id);
                  const due = dueIds.has(unit.id);
                  const state = due ? "due" : answered ? "done" : "todo";

                  return (
                    <Link
                      key={unit.id}
                      className={`site-map__cell is-${state}`}
                      href={`/category/${module.slug}/question/${unit.slug}/`}
                      title={`${index + 1}. ${unit.title}`}
                      aria-label={`${module.nameZh} 第 ${index + 1} 題：${unit.title}`}
                    />
                  );
                })}
              </div>
              <span className="site-map__count">
                {done}/{module.units.length}
              </span>
            </li>
          );
        })}
      </ul>

      <ul className="site-map__legend">
        <li className="site-map__key is-todo">未作答</li>
        <li className="site-map__key is-done">已作答</li>
        <li className="site-map__key is-due">待複習</li>
      </ul>
    </section>
  );
}
