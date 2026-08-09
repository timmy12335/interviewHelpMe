"use client";

import { Card, List, Space } from "antd";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { EmptyState } from "@/components/EmptyState";
import { TagList } from "@/components/TagList";
import { withBasePath } from "@/lib/paths";
import type { QuestionListItem } from "@/types/question";

export interface QuestionListProps {
  /** 要顯示的題目資料。 */
  questions: QuestionListItem[];
  /** 卡片標題，預設為「題目列表」。 */
  title?: string;
  /** 無題目時顯示的文字，預設為「尚無題目」。 */
  emptyText?: string;
  /**
   * 建立題目連結的函式；預設為 `withBasePath(\`/category/{slug}/question/{slug}/\`)`。
   * Server Component 請勿傳入（函式無法序列化）；Storybook 等 client 場景可覆寫。
   */
  getHref?: (question: QuestionListItem) => string;
}

const defaultGetHref = (question: QuestionListItem) =>
  withBasePath(
    `/category/${question.categorySlug}/question/${question.slug}/`,
  );

/**
 * 以卡片與清單呈現題目，並組合難度標籤、題目標籤及空狀態。
 */
export function QuestionList({
  questions,
  title = "題目列表",
  emptyText = "尚無題目",
  getHref = defaultGetHref,
}: QuestionListProps) {
  return (
    <Card title={title}>
      {questions.length === 0 ? (
        <EmptyState title={emptyText} />
      ) : (
        <List
          dataSource={questions}
          renderItem={(question) => (
            <List.Item key={question.id}>
              <Space direction="vertical" size="small">
                <a href={getHref(question)}>{question.title}</a>
                <Space size="small" wrap>
                  <DifficultyBadge difficulty={question.difficulty} />
                  <TagList tags={question.tags} max={3} />
                </Space>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
