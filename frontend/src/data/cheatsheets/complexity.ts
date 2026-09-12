import type { CheatSheet } from "./types";

export const complexity: CheatSheet = {
  slug: "complexity",
  title: "複雜度速查",
  summary: "常見資料結構與排序的複雜度，以及用規模反推解法的對照表。",
  tags: ["演算法", "複雜度"],
  relatedQuestions: [
    "algorithms/complexity-analysis",
    "algorithms/sorting-algorithm-tradeoffs",
    "algorithms/heap-and-top-k",
  ],
  sections: [
    {
      title: "資料結構",
      accent: "cyan",
      blocks: [
        {
          kind: "table",
          head: ["結構", "查找", "插入", "刪除", "備註"],
          rows: [
            ["陣列", "O(1) 依索引", "O(n)", "O(n)", "記憶體連續，快取友善"],
            ["動態陣列", "O(1)", "均攤 O(1) 尾端", "O(n)", "擴容時整批搬移"],
            ["雜湊表", "均攤 O(1)", "均攤 O(1)", "均攤 O(1)", "最壞 O(n)，看雜湊品質"],
            ["平衡樹", "O(log n)", "O(log n)", "O(log n)", "有序，可範圍查詢"],
            ["堆積", "O(1) 取極值", "O(log n)", "O(log n)", "只保證堆頂有序"],
          ],
        },
      ],
    },
    {
      title: "排序",
      accent: "violet",
      blocks: [
        {
          kind: "table",
          head: ["演算法", "平均", "最壞", "空間", "穩定"],
          rows: [
            ["快速排序", "O(n log n)", "O(n²)", "O(log n)", "否"],
            ["合併排序", "O(n log n)", "O(n log n)", "O(n)", "是"],
            ["堆積排序", "O(n log n)", "O(n log n)", "O(1)", "否"],
            ["計數排序", "O(n + k)", "O(n + k)", "O(k)", "是"],
          ],
        },
        {
          kind: "list",
          variant: "warning",
          items: ["快速排序的最壞情況來自固定樞紐遇上已排序輸入；隨機樞紐讓它成為機率極低的事件"],
        },
      ],
    },
    {
      title: "用規模反推解法",
      accent: "amber",
      blocks: [
        {
          kind: "table",
          head: ["n 的量級", "可接受的複雜度", "通常的解法"],
          rows: [
            ["≤ 20", "O(2ⁿ)、O(n!)", "狀態壓縮、回溯搜尋"],
            ["≤ 100", "O(n³)", "區間 DP、Floyd"],
            ["≤ 1,000", "O(n²)", "雙層迴圈的 DP"],
            ["≤ 10⁵", "O(n log n)", "排序、二分、堆積"],
            ["≤ 10⁷", "O(n)", "單次掃描、雙指標"],
          ],
        },
        {
          kind: "list",
          items: ["看到 n 的範圍先估算——這一步能在三十秒內把解法方向縮到一兩種"],
        },
      ],
    },
  ],
};
