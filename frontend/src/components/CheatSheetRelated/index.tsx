import Link from "next/link";

import "./index.css";

export interface CheatSheetRelatedProps {
  relatedQuestions?: string[];
}

/**
 * 速查表詳情頁的「延伸題目」區塊：連回題庫，讓速查表是一條路徑
 * （速記 → 深挖），而不是看完就沒有下一步的死路。
 */
export function CheatSheetRelated({ relatedQuestions }: CheatSheetRelatedProps) {
  if (!relatedQuestions || relatedQuestions.length === 0) {
    return null;
  }

  return (
    <section className="cs-related">
      <p className="hud-eyebrow">Related // 延伸題目</p>
      <ul>
        {relatedQuestions.map((ref, index) => {
          const [category, questionSlug] = ref.split("/");
          return (
            <li key={`${ref}-${index}`}>
              <Link href={`/category/${category}/question/${questionSlug}`}>{ref}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
