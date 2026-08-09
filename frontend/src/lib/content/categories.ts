export type CategoryMeta = {
  slug: string;
  nameZh: string;
  sortOrder: number;
};

/** 與 backend/sql/schema.sql INSERT INTO category 對齊。 */
export const CATEGORY_META: CategoryMeta[] = [
  { slug: "java", nameZh: "Java 面試題", sortOrder: 1 },
  { slug: "spring", nameZh: "Spring 面試題", sortOrder: 2 },
  { slug: "jvm", nameZh: "JVM 面試題", sortOrder: 3 },
  { slug: "java-concurrency", nameZh: "Java 併發面試題", sortOrder: 4 },
  { slug: "redis", nameZh: "Redis 面試題", sortOrder: 5 },
  { slug: "database", nameZh: "資料庫面試題", sortOrder: 6 },
  { slug: "backend-engineering", nameZh: "後端工程面試題", sortOrder: 7 },
  { slug: "system-design", nameZh: "系統設計面試題", sortOrder: 8 },
  { slug: "ai-llm", nameZh: "AI 大模型面試題", sortOrder: 9 },
  { slug: "ai-agent", nameZh: "AI Agent 面試題", sortOrder: 10 },
  { slug: "real-interviews", nameZh: "實戰面試題（真實公司考題風格）", sortOrder: 11 },
];
