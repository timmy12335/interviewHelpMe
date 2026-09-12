import Link from "next/link";
import { Tag } from "antd";

import type { CheatSheet } from "@/data/cheatsheets/types";

import "./index.css";

export interface CheatSheetListProps {
  sheets: CheatSheet[];
}

/** 速查表列表：每張一個卡片，點進去看完整內容。 */
export function CheatSheetList({ sheets }: CheatSheetListProps) {
  return (
    <div className="cs-list-grid">
      {sheets.map((sheet) => (
        <Link key={sheet.slug} href={`/cheatsheets/${sheet.slug}`} className="cs-card">
          <h2 className="cs-card__title">{sheet.title}</h2>
          <p className="cs-card__summary">{sheet.summary}</p>
          <div className="cs-card__tags">
            {sheet.tags.map((tag, index) => (
              <Tag key={`${tag}-${index}`}>{tag}</Tag>
            ))}
          </div>
          <span className="cs-card__meta">{sheet.sections.length} 個分區</span>
        </Link>
      ))}
    </div>
  );
}
