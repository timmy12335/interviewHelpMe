"use client";

import { useMemo } from "react";

import type { QuestionListItem } from "@/types/question";

import "./index.css";

export interface TagConstellationProps {
  questions: QuestionListItem[];
  selected: readonly string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
  /** 最多顯示幾個標籤，其餘以「+N」呈現。 */
  max?: number;
}

type TagCount = { tag: string; count: number };

function countTags(questions: QuestionListItem[]): TagCount[] {
  const counts = new Map<string, number>();

  for (const question of questions) {
    for (const tag of question.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 依出現次數把字級映射到 3 個級距，避免單題標籤和主軸標籤看起來一樣重。 */
function weightOf(count: number, max: number): 1 | 2 | 3 {
  if (max <= 1) {
    return 1;
  }

  const ratio = count / max;
  if (ratio >= 0.6) {
    return 3;
  }
  if (ratio >= 0.3) {
    return 2;
  }
  return 1;
}

/** 題庫標籤星圖：依出現次數決定字重，點擊即篩選題目列表。 */
export function TagConstellation({
  questions,
  selected,
  onToggle,
  onClear,
  max = 28,
}: TagConstellationProps) {
  const tags = useMemo(() => countTags(questions), [questions]);
  const visible = tags.slice(0, max);
  const hidden = tags.length - visible.length;
  const topCount = tags[0]?.count ?? 1;

  if (tags.length === 0) {
    return null;
  }

  return (
    <section className="tagmap hud-panel hud-brackets" aria-label="題庫標籤">
      <div className="tagmap__head">
        <p className="hud-eyebrow">Tags // 知識面</p>
        {selected.length > 0 ? (
          <button type="button" className="tagmap__clear" onClick={onClear}>
            清除篩選（{selected.length}）
          </button>
        ) : null}
      </div>
      <p className="tagmap__lede">
        字級代表該標籤在本題庫出現的次數。點擊標籤即可篩選右側題目。
      </p>

      <div className="tagmap__cloud">
        {visible.map(({ tag, count }) => {
          const active = selected.includes(tag);

          return (
            <button
              type="button"
              key={tag}
              className={`tagmap__tag tagmap__tag--w${weightOf(count, topCount)}${
                active ? " is-active" : ""
              }`}
              aria-pressed={active}
              onClick={() => onToggle(tag)}
            >
              {tag}
              <span className="tagmap__count">{count}</span>
            </button>
          );
        })}
        {hidden > 0 ? (
          <span className="tagmap__more">+{hidden}</span>
        ) : null}
      </div>
    </section>
  );
}
