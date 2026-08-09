/** 題目難度。 */
export type Difficulty = "easy" | "medium" | "hard";

/** 與後端 schema 對齊的題目資料。 */
export type Question = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  content: string;
  answer?: string;
  categorySlug: string;
};

/** QuestionList 列表展示所需欄位（不含 answer / content）。 */
export type QuestionListItem = Pick<
  Question,
  "id" | "slug" | "title" | "difficulty" | "tags" | "categorySlug"
>;

/** 與後端 schema 對齊的題目分類。 */
export type Category = {
  slug: string;
  nameZh: string;
  description?: string;
  questionCount?: number;
};
