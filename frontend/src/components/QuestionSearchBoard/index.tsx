"use client";

import { Card, Empty, Flex, Input, List, Pagination, Select, Space } from "antd";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { TagList } from "@/components/TagList";
import { withBasePath } from "@/lib/paths";
import type { Category, Difficulty, QuestionListItem } from "@/types/question";

const PAGE_SIZE = 12;

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "簡單" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困難" },
];

export interface QuestionSearchBoardProps {
  questions: QuestionListItem[];
  categories: Category[];
}

function matchesKeyword(question: QuestionListItem, keyword: string): boolean {
  if (!keyword) {
    return true;
  }

  const needle = keyword.toLowerCase();
  return (
    question.title.toLowerCase().includes(needle) ||
    question.tags.some((tag) => tag.toLowerCase().includes(needle))
  );
}

/** 題目大全的搜尋、篩選與分頁；資料在建置時注入，篩選全在瀏覽器端。 */
export function QuestionSearchBoard({
  questions,
  categories,
}: QuestionSearchBoardProps) {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      questions.filter(
        (question) =>
          matchesKeyword(question, keyword.trim()) &&
          (!categorySlug || question.categorySlug === categorySlug) &&
          (!difficulty || question.difficulty === difficulty),
      ),
    [questions, keyword, categorySlug, difficulty],
  );

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card title={`題目列表（${filtered.length}）`}>
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="搜尋題目標題或標籤"
          defaultValue={keyword}
          style={{ maxWidth: 320 }}
          onSearch={(value) => {
            setKeyword(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="全部題庫"
          style={{ minWidth: 200 }}
          value={categorySlug}
          onChange={(value) => {
            setCategorySlug(value);
            setPage(1);
          }}
          options={categories.map((category) => ({
            value: category.slug,
            label: category.nameZh,
          }))}
        />
        <Select
          allowClear
          placeholder="全部難度"
          style={{ minWidth: 140 }}
          value={difficulty}
          onChange={(value) => {
            setDifficulty(value);
            setPage(1);
          }}
          options={DIFFICULTY_OPTIONS}
        />
      </Flex>

      {filtered.length === 0 ? (
        <Empty description="沒有符合條件的題目" />
      ) : (
        <>
          <List
            dataSource={pageItems}
            renderItem={(question) => (
              <List.Item
                key={question.id}
                extra={<TagList tags={question.tags} max={3} />}
              >
                <List.Item.Meta
                  title={
                    <a
                      href={withBasePath(
                        `/category/${question.categorySlug}/question/${question.slug}/`,
                      )}
                    >
                      {question.title}
                    </a>
                  }
                  description={
                    <Space size="small">
                      <DifficultyBadge difficulty={question.difficulty} />
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          <Flex justify="flex-end" style={{ marginTop: 16 }}>
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              showSizeChanger={false}
              onChange={setPage}
            />
          </Flex>
        </>
      )}
    </Card>
  );
}
