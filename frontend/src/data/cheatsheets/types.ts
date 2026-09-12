/** 速查表可用的強調色，對應 globals.css 的設計 token。 */
export type Accent = "cyan" | "violet" | "amber" | "rose" | "lime";

/** 流程圖裡的一個節點。 */
export interface FlowNode {
  label: string;
  tone?: Accent;
}

/**
 * 版面原語。
 *
 * `compare` 的 `items[].blocks` 限一層巢狀——裡面不得再出現 `compare`，
 * 否則資料會變成難以閱讀的巢狀樹。這條規則由 cheatSheets.test.ts 把關。
 */
export type Block =
  | { kind: "metrics"; items: { label: string; value: string; note?: string }[] }
  | { kind: "list"; variant?: "plain" | "numbered" | "warning"; items: string[] }
  | { kind: "flow"; layers: FlowNode[][] }
  | { kind: "compare"; items: { name: string; blocks: Block[] }[] }
  | { kind: "table"; head: string[]; rows: string[][] };

export interface Section {
  title: string;
  accent?: Accent;
  blocks: Block[];
}

export interface CheatSheet {
  slug: string;
  title: string;
  /** 列表卡片上的一句話說明。 */
  summary: string;
  tags: string[];
  /**
   * 連回題庫的題目，格式 `<分類>/<題目 slug>`，例 "system-design/flash-sale-design"。
   * 題目 slug 不含編號前綴，與路由 /category/<分類>/question/<slug> 一致。
   */
  relatedQuestions?: string[];
  sections: Section[];
}
