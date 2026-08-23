/** 題目難度。 */
export type Difficulty = "easy" | "medium" | "hard";

/** 詳細解析裡的一小塊：`**小標**：內文` 拆出來的結果，可各自收合。 */
export type DetailBlock = {
  /** 沒有 `**小標**：` 前綴的段落沒有標題，會當成開場文字直接顯示。 */
  heading?: string;
  body: string;
};

/** 常見追問（可各自展開）。 */
export type FollowUp = {
  title: string;
  coreAnswer?: string;
  detail?: string;
  interviewTip?: string;
};

/** 與後端 schema 對齊的題目資料。 */
export type Question = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  content: string;
  /** 相容舊元件：核心答案～面試回答方式的合併 markdown。 */
  answer?: string;
  coreAnswer?: string;
  detail?: string;
  /** detail 依 `**小標**：` 拆出的區塊，供可掃描的收合式渲染使用。 */
  detailBlocks?: DetailBlock[];
  interviewTip?: string;
  /** 可逐字念出來的口語講稿。 */
  script?: string;
  followUps?: FollowUp[];
  related?: string[];
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
