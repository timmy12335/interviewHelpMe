import type { Question } from "@/types/question";

import { CATEGORY_META } from "./categories";
import { getAllQuestions } from "./loadContent";

/** 速查表「延伸題目」要顯示的一筆連結。 */
export type RelatedQuestionLink = {
  href: string;
  title: string;
  category: string;
};

/** 分類名稱一律以「面試題」結尾，當成標籤時那三個字沒有資訊量。 */
function shortCategoryName(categorySlug: string): string {
  const meta = CATEGORY_META.find((entry) => entry.slug === categorySlug);
  return meta ? meta.nameZh.replace(/面試題.*$/, "") : categorySlug;
}

/**
 * 把 `<分類>/<題目 slug>` 解析成畫面上可讀的連結。
 *
 * 速查表資料裡只存 slug，但直接把 slug 印出來，讀者得先猜那是哪一題才會點進去。
 * 這裡在建置時查出題目標題——站是靜態匯出的，查一次就定案，沒有執行期成本。
 */
export function resolveRelatedQuestions(refs: string[] = []): RelatedQuestionLink[] {
  if (refs.length === 0) {
    return [];
  }

  const index = new Map<string, Question>(
    getAllQuestions().map((question) => [`${question.categorySlug}/${question.slug}`, question]),
  );

  return refs.map((ref) => {
    const [categorySlug, questionSlug] = ref.split("/");

    return {
      href: `/category/${categorySlug}/question/${questionSlug}/`,
      // 查不到就退回 slug：連結本身仍然正確，而且 cheatSheets.test.ts 已經讓
      // 「ref 指向不存在的題目」在測試階段就失敗，不需要在畫面上再處理一次。
      title: index.get(ref)?.title ?? questionSlug,
      category: shortCategoryName(categorySlug),
    };
  });
}
