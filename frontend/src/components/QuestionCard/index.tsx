"use client";

import { Card, Space, Typography } from "antd";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { MdViewer } from "@/components/MdViewer";
import { TagList } from "@/components/TagList";
import type { Question } from "@/types/question";

export interface QuestionCardProps {
  /** 要顯示的題目資料。 */
  question: Question;
  /** 是否顯示推薦答案，預設為顯示；練習模式可設為 false。 */
  showAnswer?: boolean;
  /** 題目標題的選用連結；未提供時顯示純文字標題。 */
  href?: string;
}

/**
 * 以卡片呈現題目標題、難度、標籤、內容與選用的推薦答案。
 *
 * 元件只根據傳入資料渲染，不會在掛載時發出 API 請求或執行登入流程。
 */
export function QuestionCard({
  question,
  showAnswer = true,
  href,
}: QuestionCardProps) {
  const title = (
    <Typography.Title level={2} style={{ margin: 0 }}>
      {href ? <a href={href}>{question.title}</a> : question.title}
    </Typography.Title>
  );

  return (
    <Card title={title}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space size="small" wrap>
          <DifficultyBadge difficulty={question.difficulty} />
          <TagList tags={question.tags} />
        </Space>

        <section aria-label="題目內容">
          <MdViewer value={question.content} />
        </section>

        {showAnswer && question.answer ? (
          <Card
            size="small"
            type="inner"
            title={
              <Typography.Title level={3} style={{ margin: 0 }}>
                推薦答案
              </Typography.Title>
            }
          >
            <MdViewer value={question.answer} />
          </Card>
        ) : null}
      </Space>
    </Card>
  );
}
