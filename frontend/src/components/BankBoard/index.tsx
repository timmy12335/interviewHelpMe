"use client";

import { useCallback, useMemo, useState } from "react";

import { ModuleRoadmap } from "@/components/ModuleRoadmap";
import { QuestionList } from "@/components/QuestionList";
import { TagConstellation } from "@/components/TagConstellation";
import { useT } from "@/i18n/PreferencesProvider";
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
  const t = useT();

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

  // 題號固定對應題庫順序，篩選後不重編，才能對照左側題單與路線圖。
  const numbers = useMemo(
    () =>
      Object.fromEntries(
        questions.map((question, index) => [question.id, index + 1]),
      ),
    [questions],
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
          <p className="hud-eyebrow">{t("bank.unitsEyebrow")}</p>
          {selectedTags.length > 0 ? (
            <span className="bank-board__filter">
              {t("bank.filtering", { tags: selectedTags.join(" · ") })}
            </span>
          ) : null}
        </div>
        <QuestionList
          questions={filtered}
          title={t("bank.listTitle", { count: filtered.length })}
          emptyText={t("bank.emptyFiltered")}
          numbers={numbers}
        />
      </div>
    </div>
  );
}
