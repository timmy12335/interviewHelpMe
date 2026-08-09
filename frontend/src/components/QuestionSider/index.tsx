"use client";

import { Button, Flex, Layout, Menu, Typography } from "antd";
import Link from "next/link";

import { withBasePath } from "@/lib/paths";
import type { QuestionListItem } from "@/types/question";

export interface QuestionSiderProps {
  categorySlug: string;
  categoryName: string;
  questions: QuestionListItem[];
  currentSlug: string;
}

/** 題庫題目側欄：題單選單與上一題／下一題導覽。 */
export function QuestionSider({
  categorySlug,
  categoryName,
  questions,
  currentSlug,
}: QuestionSiderProps) {
  const index = questions.findIndex((item) => item.slug === currentSlug);
  const prev = index > 0 ? questions[index - 1] : undefined;
  const next =
    index >= 0 && index < questions.length - 1 ? questions[index + 1] : undefined;

  const items = questions.map((question) => ({
    key: question.slug,
    label: (
      <Link href={`/category/${categorySlug}/question/${question.slug}/`}>
        {question.title}
      </Link>
    ),
  }));

  return (
    <Layout.Sider
      width={240}
      theme="light"
      breakpoint="md"
      collapsedWidth={0}
      style={{ padding: "24px 0" }}
    >
      <Typography.Title level={4} style={{ padding: "0 20px" }}>
        <Link href={`/category/${categorySlug}/`}>{categoryName}</Link>
      </Typography.Title>
      <Flex gap={8} justify="space-between" style={{ padding: "0 20px 12px" }}>
        <Button
          size="small"
          disabled={!prev}
          href={
            prev
              ? withBasePath(
                  `/category/${categorySlug}/question/${prev.slug}/`,
                )
              : undefined
          }
        >
          上一題
        </Button>
        <Button
          size="small"
          disabled={!next}
          href={
            next
              ? withBasePath(
                  `/category/${categorySlug}/question/${next.slug}/`,
                )
              : undefined
          }
        >
          下一題
        </Button>
      </Flex>
      <Menu items={items} selectedKeys={[currentSlug]} />
    </Layout.Sider>
  );
}
