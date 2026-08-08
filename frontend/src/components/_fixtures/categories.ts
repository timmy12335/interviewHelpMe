import type { Category } from "@/types/question";

/** 分類導覽與元件測試共用的分類資料。 */
export const sampleCategories: Category[] = [
  {
    slug: "java",
    nameZh: "Java",
    description: "Java 語言基礎與核心 API",
    questionCount: 24,
  },
  {
    slug: "java-concurrency",
    nameZh: "Java 併發",
    description: "執行緒、同步機制與併發工具",
    questionCount: 16,
  },
  {
    slug: "redis",
    nameZh: "Redis",
    description: "快取、資料結構與維運實務",
    questionCount: 12,
  },
  {
    slug: "system-design",
    nameZh: "系統設計",
    description: "可擴展分散式系統的設計取捨",
    questionCount: 20,
  },
];
