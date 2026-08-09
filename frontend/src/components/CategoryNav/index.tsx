"use client";

import { Space, Typography } from "antd";
import type { MouseEvent } from "react";

import { withBasePath } from "@/lib/paths";
import type { Category } from "@/types/question";

export interface CategoryNavProps {
  /** 要顯示的題目分類。 */
  categories: Category[];
  /** 目前所在分類的 slug。 */
  activeSlug?: string;
  /**
   * 自訂分類連結；預設為 `withBasePath(\`/category/{slug}/\`)`。
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
    <nav aria-label="題目分類">
      <Space wrap>
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;
          const count =
            category.questionCount === undefined
              ? ""
              : `（${category.questionCount}）`;

          return (
            <Typography.Link
              aria-current={isActive ? "page" : undefined}
              href={getHref(category)}
              key={category.slug}
              onClick={(event) => handleClick(event, category)}
              strong={isActive}
            >
              {category.nameZh}
              {count}
            </Typography.Link>
          );
        })}
      </Space>
    </nav>
  );
}
