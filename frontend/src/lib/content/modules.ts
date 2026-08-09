import type { QuestionListItem } from "@/types/question";

import { getAllCategories, getAllQuestions } from "./loadContent";
import { toListItems } from "./toListItems";

/** 一個題庫及其題目摘要，供進度地圖與進度環使用。 */
export type ModuleSummary = {
  slug: string;
  nameZh: string;
  units: QuestionListItem[];
};

/** 建置時彙整全部題庫與題目，供 client 端比對本機練習進度。 */
export function getModuleSummaries(): ModuleSummary[] {
  const questions = toListItems(getAllQuestions());

  return getAllCategories().map((category) => ({
    slug: category.slug,
    nameZh: category.nameZh,
    units: questions.filter((unit) => unit.categorySlug === category.slug),
  }));
}
