import type { Question, QuestionListItem } from "@/types/question";

/**
 * 去掉 content / answer 等大型欄位，只留列表顯示所需的資料。
 * Server Component 傳給 Client Component 前務必先轉換，避免整份題庫被序列化進 HTML。
 */
export function toListItems(questions: Question[]): QuestionListItem[] {
  return questions.map(({ id, slug, title, difficulty, tags, categorySlug }) => ({
    id,
    slug,
    title,
    difficulty,
    tags,
    categorySlug,
  }));
}
