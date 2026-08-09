import type { Question } from "@/types/question";

/** 共用元件預設展示使用的題目。 */
export const sampleQuestion: Question = {
  id: "question-1",
  slug: "java-string-equality",
  title: "Java 中 == 與 equals 有什麼差異？",
  difficulty: "easy",
  tags: ["Java", "字串"],
  content: "請說明 `==` 與 `equals` 在比較物件時的差異。",
  answer: "`==` 比較參考是否相同，`equals` 則可比較物件內容。",
  coreAnswer: "`==` 比較參考是否相同，`equals` 則可比較物件內容。",
  categorySlug: "java",
};

/** 列表與空間配置展示使用的題目集合。 */
export const sampleQuestions: Question[] = [
  sampleQuestion,
  {
    id: "question-2",
    slug: "java-thread-pool",
    title: "如何選擇 Java 執行緒池參數？",
    difficulty: "medium",
    tags: ["Java", "Concurrency", "Thread Pool"],
    content: "請依 CPU 密集與 I/O 密集工作說明參數選擇原則。",
    categorySlug: "java-concurrency",
  },
  {
    id: "question-3",
    slug: "redis-cache-penetration",
    title: "如何避免 Redis 快取穿透？",
    difficulty: "hard",
    tags: ["Redis", "Cache"],
    content: "請比較空值快取與布隆過濾器的適用情境。",
    answer: "可依資料特性採用空值快取、布隆過濾器或請求合併。",
    categorySlug: "redis",
  },
];

/** 驗證大量標籤排版與截斷行為的題目。 */
export const manyTagsQuestion: Question = {
  id: "question-many-tags",
  slug: "distributed-system-tradeoffs",
  title: "分散式系統設計需要考量哪些取捨？",
  difficulty: "hard",
  tags: [
    "System Design",
    "Distributed Systems",
    "CAP",
    "Consistency",
    "Availability",
    "Scalability",
    "Caching",
    "Messaging",
  ],
  content: "請從一致性、可用性、延遲與維運成本分析設計取捨。",
  categorySlug: "system-design",
};
