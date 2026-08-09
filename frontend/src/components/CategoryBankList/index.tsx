"use client";

import List from "antd/es/list";
import Link from "next/link";

import type { Category } from "@/types/question";

import "./index.css";

export interface CategoryBankListProps {
  /** 要顯示的題庫（分類）。 */
  categories: Category[];
  /** 編號起始值，讓首頁與題庫大全的代號連續。 */
  indexOffset?: number;
}

/** 依 slug 取穩定的強調色，避免每次渲染跳色。 */
const ACCENTS = ["cyan", "violet", "lime", "amber", "rose"] as const;

function accentOf(slug: string): (typeof ACCENTS)[number] {
  const sum = [...slug].reduce((total, char) => total + char.charCodeAt(0), 0);
  return ACCENTS[sum % ACCENTS.length];
}

/** 題庫列表：以 HUD 模組卡呈現各分類與題數。 */
export function CategoryBankList({
  categories,
  indexOffset = 0,
}: CategoryBankListProps) {
  return (
    <List
      className="bank-grid"
      grid={{ gutter: 16, column: 4, xs: 1, sm: 2, md: 3, lg: 4 }}
      dataSource={categories}
      renderItem={(category, index) => (
        <List.Item key={category.slug}>
          <Link
            className={`bank-card hud-panel hud-brackets bank-card--${accentOf(category.slug)}`}
            href={`/category/${category.slug}/`}
          >
            <span className="bank-card__scan" aria-hidden />
            <div className="bank-card__top">
              <span className="hud-index">
                MOD-{String(indexOffset + index + 1).padStart(2, "0")}
              </span>
              <span className="bank-card__count">
                {category.questionCount ?? 0}
                <small>題</small>
              </span>
            </div>
            <h3 className="bank-card__title">{category.nameZh}</h3>
            <span className="bank-card__cta">開始練習 →</span>
          </Link>
        </List.Item>
      )}
    />
  );
}
