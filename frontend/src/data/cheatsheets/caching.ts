import type { CheatSheet } from "./types";

export const caching: CheatSheet = {
  slug: "caching",
  title: "快取策略速查",
  summary: "四種讀寫模式的取捨，以及三個經典失效問題的因應。",
  tags: ["快取", "Redis", "一致性"],
  relatedQuestions: [
    "system-design/caching-strategies",
    "system-design/cache-invalidation",
    "redis/cache-penetration",
    "redis/cache-breakdown",
    "redis/cache-avalanche",
  ],
  sections: [
    {
      title: "讀寫模式",
      accent: "cyan",
      blocks: [
        {
          kind: "table",
          head: ["模式", "讀", "寫", "適用"],
          rows: [
            ["Cache Aside", "先查快取，未命中回源並回填", "寫資料庫後讓快取失效", "最常用，讀多寫少"],
            ["Read Through", "由快取層代為回源", "同 Cache Aside", "想把回源邏輯收斂在一處"],
            ["Write Through", "同 Read Through", "同時寫快取與資料庫", "要求快取永遠是最新"],
            ["Write Back", "同 Read Through", "只寫快取，非同步刷回", "寫極多，且可接受丟失"],
          ],
        },
        {
          kind: "list",
          variant: "warning",
          items: ["Write Back 在快取節點掛掉時會丟資料，金額相關的場景不要用"],
        },
      ],
    },
    {
      title: "Cache Aside 的讀取路徑",
      accent: "violet",
      blocks: [
        {
          kind: "flow",
          layers: [
            [{ label: "Client", tone: "amber" }],
            [{ label: "查快取", tone: "violet" }],
            [
              { label: "命中：直接回傳", tone: "lime" },
              { label: "未命中：回源", tone: "rose" },
            ],
            [{ label: "回填快取", tone: "cyan" }],
          ],
        },
      ],
    },
    {
      title: "三個經典問題",
      accent: "rose",
      blocks: [
        {
          kind: "compare",
          items: [
            {
              name: "快取穿透",
              blocks: [
                { kind: "list", items: ["查一個根本不存在的鍵", "每次都打到資料庫"] },
                { kind: "list", variant: "numbered", items: ["空值也快取（短 TTL）", "布隆過濾器擋掉一定不存在的"] },
              ],
            },
            {
              name: "快取擊穿",
              blocks: [
                { kind: "list", items: ["單一熱門鍵過期", "瞬間大量請求同時回源"] },
                { kind: "list", variant: "numbered", items: ["互斥鎖，只讓一個請求回源", "熱點鍵不設過期，改為背景更新"] },
              ],
            },
            {
              name: "快取雪崩",
              blocks: [
                { kind: "list", items: ["大量鍵同時過期", "或快取節點整批掛掉"] },
                { kind: "list", variant: "numbered", items: ["過期時間加隨機抖動", "多層快取與熔斷降級"] },
              ],
            },
          ],
        },
      ],
    },
  ],
};
