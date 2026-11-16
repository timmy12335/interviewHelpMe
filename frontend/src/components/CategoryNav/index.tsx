"use client";

import type { MouseEvent } from "react";

import { useLocalized, useT } from "@/i18n/PreferencesProvider";
import { withBasePath } from "@/lib/paths";
import type { Category } from "@/types/question";

export interface CategoryNavProps {
  /** 要顯示的題目分類。 */
  categories: Category[];
  /** 目前所在分類的 slug。 */
  activeSlug?: string;
  /**
   * 自訂分類連結；預設為 withBasePath(`/category/{slug}/`)。
   * Server Component 請勿傳入（函式無法序列化）；Storybook 等 client 場景可覆寫。
   */
  getHref?: (category: Category) => string;
  /** 攔截連結導航，交由外部路由器處理。 */
  onNavigate?: (category: Category) => void;
}

const defaultGetHref = (category: Category) =>
  withBasePath(`/category/${category.slug}/`);

/**
 * 顯示題目分類導覽，並標示目前所在的分類。
 */
export function CategoryNav({
  categories,
  activeSlug,
  getHref = defaultGetHref,
  onNavigate,
}: CategoryNavProps) {
  const t = useT();
  const pick = useLocalized();
  const handleClick = (
    event: MouseEvent<HTMLElement>,
    category: Category,
  ) => {
    if (!onNavigate) {
      return;
    }

    event.preventDefault();
    onNavigate(category);
  };

  return (
    <nav aria-label={t("categoryNav.aria")} className="category-nav">
      {categories.map((category) => {
        const isActive = category.slug === activeSlug;
        const name = pick(category.nameZh, category.nameEn);
        const count =
          category.questionCount === undefined
            ? null
            : category.questionCount;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            aria-label={
              count === null ? name : t("categoryNav.count", { name, count })
            }
            className="category-chip"
            href={getHref(category)}
            key={category.slug}
            onClick={(event) => handleClick(event, category)}
          >
            <span>{name}</span>
            {count !== null ? (
              <span className="category-chip__count" aria-hidden>
                {count}
              </span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}
