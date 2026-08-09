"use client";

import { useCallback, useMemo, useState } from "react";

import { ModuleRoadmap } from "@/components/ModuleRoadmap";
import { QuestionList } from "@/components/QuestionList";
import { TagConstellation } from "@/components/TagConstellation";
import type { QuestionListItem } from "@/types/question";

import "./index.css";

export interface BankBoardProps {
  categorySlug: string;
  questions: QuestionListItem[];
}

/**
 * 題庫工作區：左側路線圖與標籤星圖，右側題目列表。
 * 標籤選取狀態要同時影響兩邊，所以放在同一個 client 元件。
 */
export function BankBoard({ categorySlug, questions }: BankBoardProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }, []);

  const clearTags = useCallback(() => setSelectedTags([]), []);

  // 多選採聯集：選越多題目越多，符合「探索這個題庫」的直覺。
  const filtered = useMemo(
    () =>
      selectedTags.length === 0
        ? questions
        : questions.filter((question) =>
            question.tags.some((tag) => selectedTags.includes(tag)),
          ),
    [questions, selectedTags],
  );

  return (
    <div className="bank-board">
      <div className="bank-board__aside">
        <ModuleRoadmap categorySlug={categorySlug} questions={questions} />
        <TagConstellation
          questions={questions}
          selected={selectedTags}
          onToggle={toggleTag}
          onClear={clearTags}
        />
      </div>

      <div className="bank-board__main">
        <div className="section-head">
          <p className="hud-eyebrow">Units // 題目列表</p>
          {selectedTags.length > 0 ? (
            <span className="bank-board__filter">
              篩選中：{selectedTags.join("、")}
            </span>
          ) : null}
        </div>
        <QuestionList
          questions={filtered}
          title={`題目列表（${filtered.length}）`}
          emptyText="沒有符合所選標籤的題目"
        />
      </div>
    </div>
  );
}
