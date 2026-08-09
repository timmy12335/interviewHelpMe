"use client";

import List from "antd/es/list";
import Link from "next/link";
import { useMemo } from "react";

import { ProgressRing } from "@/components/ProgressRing";
import { useProgress } from "@/hooks/useProgress";
import type { ModuleSummary } from "@/lib/content/modules";

import "./index.css";

export interface CategoryBankListProps {
  /** 要顯示的題庫與其題目摘要。 */
  modules: ModuleSummary[];
  /** 編號起始值，讓首頁與題庫大全的代號連續。 */
  indexOffset?: number;
}

/** 依 slug 取穩定的強調色，避免每次渲染跳色。 */
const ACCENTS = ["cyan", "violet", "lime", "amber", "rose"] as const;

function accentOf(slug: string): (typeof ACCENTS)[number] {
  const sum = [...slug].reduce((total, char) => total + char.charCodeAt(0), 0);
  return ACCENTS[sum % ACCENTS.length];
}

/** 題庫列表：以 HUD 模組卡呈現各分類、題數與本機練習進度。 */
export function CategoryBankList({
  modules,
  indexOffset = 0,
}: CategoryBankListProps) {
  const allIds = useMemo(
    () => modules.flatMap((module) => module.units.map((unit) => unit.id)),
    [modules],
  );
  const { answeredIds, dueIds } = useProgress(allIds);

  return (
    <List
      className="bank-grid"
      grid={{ gutter: 16, column: 4, xs: 1, sm: 2, md: 3, lg: 4 }}
      dataSource={modules}
      renderItem={(module, index) => {
        const done = module.units.filter((unit) =>
          answeredIds.has(unit.id),
        ).length;
        const due = module.units.some((unit) => dueIds.has(unit.id));

        return (
          <List.Item key={module.slug}>
            <Link
              className={`bank-card hud-panel hud-brackets bank-card--${accentOf(module.slug)}`}
              href={`/category/${module.slug}/`}
            >
              <span className="bank-card__scan" aria-hidden />
              <div className="bank-card__top">
                <span className="hud-index">
                  MOD-{String(indexOffset + index + 1).padStart(2, "0")}
                </span>
                <span className="bank-card__count">
                  {module.units.length}
                  <small>題</small>
                </span>
              </div>
              <h3 className="bank-card__title">{module.nameZh}</h3>
              <div className="bank-card__foot">
                <span className="bank-card__cta">開始練習 →</span>
                {done > 0 || due ? (
                  <span className="bank-card__progress">
                    <ProgressRing
                      value={done}
                      total={module.units.length}
                      size={30}
                      due={due}
                      label={`${module.nameZh} 已作答 ${done} 題，共 ${module.units.length} 題`}
                    />
                    <span className="bank-card__progress-text">
                      {done}/{module.units.length}
                    </span>
                  </span>
                ) : null}
              </div>
            </Link>
          </List.Item>
        );
      }}
    />
  );
}
