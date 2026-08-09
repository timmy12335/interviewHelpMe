"use client";

import { Avatar, Card, List, Typography } from "antd";
import Link from "next/link";

import type { Category } from "@/types/question";

export interface CategoryBankListProps {
  /** 要顯示的題庫（分類）。 */
  categories: Category[];
}

/** 依題庫名稱取穩定的頭像底色，避免每次渲染跳色。 */
const AVATAR_COLORS = [
  "#1677ff",
  "#13c2c2",
  "#52c41a",
  "#faad14",
  "#eb2f96",
  "#722ed1",
];

function avatarColor(slug: string): string {
  const sum = [...slug].reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

/** 題庫列表：以卡片網格呈現各分類與題數。 */
export function CategoryBankList({ categories }: CategoryBankListProps) {
  return (
    <div className="category-bank-list">
      <List
        grid={{ gutter: 16, column: 4, xs: 1, sm: 2, md: 3, lg: 3 }}
        dataSource={categories}
        renderItem={(category) => (
          <List.Item key={category.slug}>
            <Card hoverable>
              <Link href={`/category/${category.slug}/`}>
                <Card.Meta
                  avatar={
                    <Avatar style={{ backgroundColor: avatarColor(category.slug) }}>
                      {category.nameZh.slice(0, 1)}
                    </Avatar>
                  }
                  title={category.nameZh}
                  description={
                    <Typography.Paragraph
                      type="secondary"
                      ellipsis={{ rows: 1 }}
                      style={{ marginBottom: 0 }}
                    >
                      {category.questionCount ?? 0} 題
                    </Typography.Paragraph>
                  }
                />
              </Link>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
