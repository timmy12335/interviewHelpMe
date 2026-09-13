import Link from "next/link";

import type { RelatedQuestionLink } from "@/lib/content/relatedQuestions";

import "./index.css";

export interface CheatSheetRelatedProps {
  items?: RelatedQuestionLink[];
}

/**
 * 速查表詳情頁的「延伸題目」區塊：連回題庫，讓速查表是一條路徑
 * （速記 → 深挖），而不是看完就沒有下一步的死路。
 *
 * 這裡只負責顯示；把 slug 解析成標題是頁面的事（要讀 content/，只能在伺服器端做）。
 */
export function CheatSheetRelated({ items }: CheatSheetRelatedProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="cs-related">
      <p className="hud-eyebrow">Related // 延伸題目</p>
      <ul>
        {items.map((item, index) => (
          <li key={`${item.href}-${index}`}>
            <Link href={item.href}>
              <span className="cs-related__category">{item.category}</span>
              <span className="cs-related__title">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
