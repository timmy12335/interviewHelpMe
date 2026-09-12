# 面試速查表頁面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `/cheatsheets` 與 `/cheatsheets/[slug]` 兩個頁面，用結構化資料渲染出 ByteByteGo 風格的面試速查表，視覺沿用站上既有的深色 HUD。

**Architecture:** 速查表資料是手寫的 TypeScript 物件（`frontend/src/data/cheatsheets/`），由五個版面原語元件渲染（metrics / list / flow / compare / table）。資料與渲染分離，新增一張速查表只需新增一個資料檔。不動 `content/` 目錄，因為那裡每個子目錄都被當成題目分類。

**Tech Stack:** Next.js 14（靜態匯出）、React 18、TypeScript、Ant Design 5、Vitest + @testing-library/react、原生 CSS（沿用 `globals.css` 的設計 token）

**Spec:** `docs/superpowers/specs/2026-09-12-cheatsheet-page-design.md`

## Global Constraints

這些是全域規則，每個 Task 的要求都隱含包含本節：

- **不得使用 `dangerouslySetInnerHTML`。** 全站目前 0 處，維持 0。
- **不得引入任何對外請求**——無字型 CDN、無分析、無圖片外連。
- **速查表內容不得含個資**：真實姓名、email、公司內部系統名稱、可辨識的事故細節。
- **範例中不得出現憑證形狀的字串**；需要示意時用 `<API_KEY>` 這種明顯佔位符，網域用 `example.com`。
- 元件慣例：`ComponentName/index.tsx` + `ComponentName/index.css`，在 tsx 內 `import "./index.css"`。
- 強調色只用既有 token：`--cyan` `--violet` `--amber` `--rose` `--lime`。
- 路徑別名 `@/` 指向 `frontend/src/`。
- `next/link` **不要**套 `withBasePath`；Next.js 會自動處理。
- 所有指令都在 `frontend/` 目錄下執行。

---

## File Structure

| 檔案 | 職責 |
|------|------|
| `src/data/cheatsheets/types.ts` | `CheatSheet` / `Section` / `Block` / `FlowNode` / `Accent` 型別 |
| `src/data/cheatsheets/index.ts` | `cheatSheets` 陣列與 `getCheatSheet(slug)` |
| `src/data/cheatsheets/system-design.ts` | 系統設計速查表資料（驗證 metrics / list / flow / compare） |
| `src/data/cheatsheets/caching.ts` | 快取策略速查表資料（驗證 flow / compare / table） |
| `src/data/cheatsheets/complexity.ts` | 複雜度速查表資料（驗證 table / list-warning） |
| `src/data/cheatsheets/cheatSheets.test.ts` | 資料完整性測試 |
| `src/components/CheatSheet/blocks/MetricsBlock.tsx` | 指標徽章 |
| `src/components/CheatSheet/blocks/ListBlock.tsx` | 清單（plain / numbered / warning） |
| `src/components/CheatSheet/blocks/FlowBlock.tsx` | 分層節點圖 |
| `src/components/CheatSheet/blocks/CompareBlock.tsx` | 並排比較卡（可內嵌其他原語，限一層） |
| `src/components/CheatSheet/blocks/TableBlock.tsx` | 表格 |
| `src/components/CheatSheet/blocks/BlockRenderer.tsx` | 依 `kind` 分派到上述元件 |
| `src/components/CheatSheet/index.tsx` | 一張速查表的骨架（標題 + sections） |
| `src/components/CheatSheet/index.css` | 上述全部的樣式 |
| `src/components/CheatSheetList/index.tsx` | 列表頁的卡片列 |
| `src/components/CheatSheetList/index.css` | 卡片樣式 |
| `src/app/cheatsheets/page.tsx` | 列表頁 |
| `src/app/cheatsheets/[slug]/page.tsx` | 詳情頁 + `generateStaticParams` |
| `src/config/menu.ts` | 新增導覽項（修改） |

---

### Task 1: 型別與資料模組骨架

**Files:**
- Create: `frontend/src/data/cheatsheets/types.ts`
- Create: `frontend/src/data/cheatsheets/index.ts`
- Create: `frontend/src/data/cheatsheets/system-design.ts`
- Test: `frontend/src/data/cheatsheets/cheatSheets.test.ts`

**Interfaces:**
- Consumes: 無（第一個 Task）
- Produces:
  - `type Accent = "cyan" | "violet" | "amber" | "rose" | "lime"`
  - `interface FlowNode { label: string; tone?: Accent }`
  - `type Block`（五種 kind，見下方程式碼）
  - `interface Section { title: string; accent?: Accent; blocks: Block[] }`
  - `interface CheatSheet { slug, title, summary, tags, relatedQuestions?, sections }`
  - `const cheatSheets: CheatSheet[]`
  - `function getCheatSheet(slug: string): CheatSheet | undefined`

- [ ] **Step 1: 寫失敗的測試**

建立 `frontend/src/data/cheatsheets/cheatSheets.test.ts`：

```ts
import { describe, expect, it } from "vitest";

import { cheatSheets, getCheatSheet } from "./index";

describe("cheat sheet 資料", () => {
  it("至少有一張速查表", () => {
    expect(cheatSheets.length).toBeGreaterThan(0);
  });

  it("slug 全站唯一", () => {
    const slugs = cheatSheets.map((sheet) => sheet.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slug 只含 URL 安全字元", () => {
    const bad = cheatSheets
      .map((sheet) => sheet.slug)
      .filter((slug) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug));
    expect(bad).toEqual([]);
  });

  it("getCheatSheet 找得到既有的、找不到不存在的", () => {
    expect(getCheatSheet(cheatSheets[0].slug)).toBe(cheatSheets[0]);
    expect(getCheatSheet("does-not-exist")).toBeUndefined();
  });
});
```

- [ ] **Step 2: 執行測試，確認它失敗**

Run: `cd frontend && npx vitest run src/data/cheatsheets/cheatSheets.test.ts`
Expected: FAIL — `Failed to resolve import "./index"`

- [ ] **Step 3: 寫型別**

建立 `frontend/src/data/cheatsheets/types.ts`：

```ts
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
```

- [ ] **Step 4: 寫第一張速查表的資料**

建立 `frontend/src/data/cheatsheets/system-design.ts`：

```ts
import type { CheatSheet } from "./types";

export const systemDesign: CheatSheet = {
  slug: "system-design",
  title: "系統設計速查",
  summary: "高可用、高吞吐、高擴展三條主線的判準、指標與常見做法。",
  tags: ["系統設計", "高可用", "擴展性"],
  relatedQuestions: [
    "system-design/system-design-methodology",
    "system-design/capacity-estimation",
    "system-design/availability-tiers",
  ],
  sections: [
    {
      title: "高可用",
      accent: "cyan",
      blocks: [
        {
          kind: "metrics",
          items: [
            { label: "4 nines", value: "99.99%", note: "每天可停機 8.64 秒" },
            { label: "5 nines", value: "99.999%", note: "每天可停機 864 毫秒" },
            { label: "RTO", value: "Recovery Time Objective", note: "多久要恢復" },
            { label: "RPO", value: "Recovery Point Objective", note: "可以丟多少資料" },
          ],
        },
        {
          kind: "list",
          variant: "numbered",
          items: ["冗餘：任何元件都要有備份", "消除單點故障：沒有任何一個節點掛掉會讓整體不可用"],
        },
        {
          kind: "compare",
          items: [
            {
              name: "Hot-Hot",
              blocks: [
                {
                  kind: "flow",
                  layers: [
                    [{ label: "API Gateway", tone: "amber" }],
                    [
                      { label: "Order Service", tone: "rose" },
                      { label: "Order Service", tone: "rose" },
                    ],
                    [{ label: "Payment Service", tone: "cyan" }],
                  ],
                },
                { kind: "list", items: ["兩邊同時服務流量", "切換無感，但成本是雙倍"] },
              ],
            },
            {
              name: "Hot-Warm",
              blocks: [
                {
                  kind: "flow",
                  layers: [
                    [{ label: "API Gateway", tone: "amber" }],
                    [
                      { label: "Order Service", tone: "lime" },
                      { label: "Order Service (standby)", tone: "violet" },
                    ],
                    [{ label: "Payment Service", tone: "cyan" }],
                  ],
                },
                { kind: "list", items: ["備援待命不接流量", "成本低，但切換有中斷視窗"] },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "高吞吐",
      accent: "violet",
      blocks: [
        {
          kind: "metrics",
          items: [
            { label: "QPS", value: "Queries per second", note: "每秒查詢數" },
            { label: "TPS", value: "Transactions per second", note: "每秒交易數" },
          ],
        },
        {
          kind: "list",
          variant: "numbered",
          items: ["快取：先擋掉重複的讀", "找出瓶頸：先量再改", "加執行緒與實例", "尖峰管理：削峰、限流"],
        },
      ],
    },
    {
      title: "高擴展",
      accent: "lime",
      blocks: [
        {
          kind: "metrics",
          items: [{ label: "RT", value: "Response Time", note: "回應時間" }],
        },
        {
          kind: "list",
          variant: "numbered",
          items: ["服務職責切分乾淨", "善用負載平衡與服務發現", "容量規劃要先於流量到來"],
        },
      ],
    },
  ],
};
```

- [ ] **Step 5: 寫 index**

建立 `frontend/src/data/cheatsheets/index.ts`：

```ts
import { systemDesign } from "./system-design";
import type { CheatSheet } from "./types";

/** 全部速查表，順序即列表頁顯示順序。 */
export const cheatSheets: CheatSheet[] = [systemDesign];

export function getCheatSheet(slug: string): CheatSheet | undefined {
  return cheatSheets.find((sheet) => sheet.slug === slug);
}

export type { Accent, Block, CheatSheet, FlowNode, Section } from "./types";
```

- [ ] **Step 6: 執行測試，確認它通過**

Run: `cd frontend && npx vitest run src/data/cheatsheets/cheatSheets.test.ts`
Expected: PASS（4 個測試）

- [ ] **Step 7: 提交**

```bash
cd /Users/wangzhilin/interviewHelpMe
git add frontend/src/data/cheatsheets/
git commit -m "feat: add cheat sheet data model and the system design sheet

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: 資料完整性規則

把「看不出來但會壞掉」的規則變成測試：表格欄數不一致只會看成排版歪掉、`relatedQuestions` 打錯只會產生 404、空 section 只會是一塊空白。

**Files:**
- Modify: `frontend/src/data/cheatsheets/cheatSheets.test.ts`（Task 1 建立）

**Interfaces:**
- Consumes: Task 1 的 `cheatSheets`、`Block`
- Produces: 無新的匯出

- [ ] **Step 1: 加上失敗的測試**

在 `cheatSheets.test.ts` 的 import 區加入：

```ts
import { getAllQuestions } from "@/lib/content/loadContent";

import type { Block } from "./types";
```

在檔案末端（`describe` 之外）加入這個輔助函式：

```ts
/** 攤平一張速查表的所有 block，含 compare 內嵌的那一層。 */
function allBlocks(blocks: Block[]): Block[] {
  return blocks.flatMap((block) =>
    block.kind === "compare"
      ? [block, ...block.items.flatMap((item) => item.blocks)]
      : [block],
  );
}
```

在 `describe("cheat sheet 資料", ...)` 內加入四個測試：

```ts
  it("每個 section 至少有一個 block", () => {
    const empty = cheatSheets.flatMap((sheet) =>
      sheet.sections
        .filter((section) => section.blocks.length === 0)
        .map((section) => `${sheet.slug} / ${section.title}`),
    );
    expect(empty).toEqual([]);
  });

  it("table 每一列的欄數等於表頭欄數", () => {
    // 欄數不一致在畫面上只會看成排版歪掉，不會報錯。
    const wrong = cheatSheets.flatMap((sheet) =>
      sheet.sections.flatMap((section) =>
        allBlocks(section.blocks).flatMap((block) =>
          block.kind === "table"
            ? block.rows
                .filter((row) => row.length !== block.head.length)
                .map(
                  (row) =>
                    `${sheet.slug}：表頭 ${block.head.length} 欄，有一列 ${row.length} 欄`,
                )
            : [],
        ),
      ),
    );
    expect(wrong).toEqual([]);
  });

  it("compare 內不得再有 compare（限一層巢狀）", () => {
    const nested = cheatSheets.flatMap((sheet) =>
      sheet.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
          block.kind === "compare"
            ? block.items
                .filter((item) => item.blocks.some((inner) => inner.kind === "compare"))
                .map((item) => `${sheet.slug} / ${item.name}`)
            : [],
        ),
      ),
    );
    expect(nested).toEqual([]);
  });

  it("relatedQuestions 都指向真實存在的題目", () => {
    // 打錯只會產生一個 404 連結，不會有任何錯誤訊息。
    const index = new Set(
      getAllQuestions().map((question) => `${question.categorySlug}/${question.slug}`),
    );
    const broken = cheatSheets.flatMap((sheet) =>
      (sheet.relatedQuestions ?? [])
        .filter((ref) => !index.has(ref))
        .map((ref) => `${sheet.slug} 指向不存在的 ${ref}`),
    );
    expect(broken).toEqual([]);
  });
```

- [ ] **Step 2: 執行測試，確認四個新測試都通過**

兩件事已先查證，不需要在這一步摸索：`Question` 的分類欄位叫 **`categorySlug`**（不是
`category`），上面的程式碼已經用對；Task 1 寫進 `system-design.ts` 的三個 ref 也確認
存在於 `content/system-design/`。

Run: `cd frontend && npx vitest run src/data/cheatsheets/cheatSheets.test.ts`
Expected: PASS（8 個測試）

- [ ] **Step 3: 提交**

```bash
cd /Users/wangzhilin/interviewHelpMe
git add frontend/src/data/cheatsheets/
git commit -m "test: enforce cheat sheet data rules that fail silently

Column-count mismatches read as crooked layout, a wrong relatedQuestions
ref renders a 404 link, and an empty section is just blank space — none
of them raise anything at build time.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: 五個版面原語元件

**Files:**
- Create: `frontend/src/components/CheatSheet/blocks/MetricsBlock.tsx`
- Create: `frontend/src/components/CheatSheet/blocks/ListBlock.tsx`
- Create: `frontend/src/components/CheatSheet/blocks/FlowBlock.tsx`
- Create: `frontend/src/components/CheatSheet/blocks/TableBlock.tsx`
- Create: `frontend/src/components/CheatSheet/blocks/CompareBlock.tsx`
- Create: `frontend/src/components/CheatSheet/blocks/BlockRenderer.tsx`
- Test: `frontend/src/components/CheatSheet/blocks/BlockRenderer.test.tsx`

**Interfaces:**
- Consumes: Task 1 的 `Block`、`FlowNode`、`Accent`
- Produces: `function BlockRenderer({ block }: { block: Block }): JSX.Element`
  （`CheatSheet/index.tsx` 會用它；各原語元件不對外匯出使用）

- [ ] **Step 1: 寫失敗的測試**

建立 `frontend/src/components/CheatSheet/blocks/BlockRenderer.test.tsx`：

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Block } from "@/data/cheatsheets/types";

import { BlockRenderer } from "./BlockRenderer";

afterEach(cleanup);

describe("BlockRenderer", () => {
  it("metrics：標籤、數值與註解都出現", () => {
    const block: Block = {
      kind: "metrics",
      items: [{ label: "4 nines", value: "99.99%", note: "每天 8.64 秒" }],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("4 nines")).toBeInTheDocument();
    expect(screen.getByText("99.99%")).toBeInTheDocument();
    expect(screen.getByText("每天 8.64 秒")).toBeInTheDocument();
  });

  it("list：每個項目都出現", () => {
    const block: Block = { kind: "list", variant: "numbered", items: ["冗餘", "無單點"] };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("冗餘")).toBeInTheDocument();
    expect(screen.getByText("無單點")).toBeInTheDocument();
  });

  it("flow：每一層的節點都出現", () => {
    const block: Block = {
      kind: "flow",
      layers: [[{ label: "API Gateway" }], [{ label: "Order Service" }]],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("API Gateway")).toBeInTheDocument();
    expect(screen.getByText("Order Service")).toBeInTheDocument();
  });

  it("table：表頭與儲存格都出現", () => {
    const block: Block = {
      kind: "table",
      head: ["策略", "一致性"],
      rows: [["Cache Aside", "最終一致"]],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.getByText("Cache Aside")).toBeInTheDocument();
  });

  it("compare：卡片名稱與內嵌 block 都出現", () => {
    const block: Block = {
      kind: "compare",
      items: [{ name: "Hot-Hot", blocks: [{ kind: "list", items: ["雙倍成本"] }] }],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("Hot-Hot")).toBeInTheDocument();
    expect(screen.getByText("雙倍成本")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 執行測試，確認它失敗**

Run: `cd frontend && npx vitest run src/components/CheatSheet/`
Expected: FAIL — `Failed to resolve import "./BlockRenderer"`

- [ ] **Step 3: 寫 MetricsBlock**

```tsx
import type { Block } from "@/data/cheatsheets/types";

type MetricsBlock = Extract<Block, { kind: "metrics" }>;

/** 指標徽章：標籤（徽章）＋ 數值（強調）＋ 一句註解。 */
export function MetricsBlock({ block }: { block: MetricsBlock }) {
  return (
    <dl className="cs-metrics">
      {block.items.map((item) => (
        <div key={item.label} className="cs-metric">
          <dt className="cs-metric__label">{item.label}</dt>
          <dd className="cs-metric__body">
            <span className="cs-metric__value">{item.value}</span>
            {item.note ? <span className="cs-metric__note">{item.note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 4: 寫 ListBlock**

```tsx
import type { Block } from "@/data/cheatsheets/types";

type ListBlock = Extract<Block, { kind: "list" }>;

/** 清單：plain 為項目符號、numbered 為編號、warning 為警示樣式。 */
export function ListBlock({ block }: { block: ListBlock }) {
  const variant = block.variant ?? "plain";
  const className = `cs-list cs-list--${variant}`;

  if (variant === "numbered") {
    return (
      <ol className={className}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <ul className={className}>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: 寫 FlowBlock**

```tsx
import { Fragment } from "react";

import type { Block } from "@/data/cheatsheets/types";

type FlowBlock = Extract<Block, { kind: "flow" }>;

/**
 * 分層節點圖：相鄰兩層之間以一段連接線示意「全連接」。
 *
 * 刻意不做通用圖渲染——參考圖上的小圖都是兩到三層的扇出／匯聚，
 * 分層模型就夠用，而且純 CSS 可畫，不需要 SVG 路徑計算。
 */
export function FlowBlock({ block }: { block: FlowBlock }) {
  return (
    <div className="cs-flow">
      {block.layers.map((layer, layerIndex) => (
        <Fragment key={layer.map((node) => node.label).join("|")}>
          {layerIndex > 0 ? <div className="cs-flow__link" aria-hidden="true" /> : null}
          <div className="cs-flow__layer">
            {layer.map((node) => (
              <span
                key={node.label}
                className={`cs-flow__node cs-flow__node--${node.tone ?? "cyan"}`}
              >
                {node.label}
              </span>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: 寫 TableBlock**

```tsx
import type { Block } from "@/data/cheatsheets/types";

type TableBlock = Extract<Block, { kind: "table" }>;

/** 表格：欄數一致性由 cheatSheets.test.ts 把關，這裡直接渲染。 */
export function TableBlock({ block }: { block: TableBlock }) {
  return (
    <div className="cs-table-wrap">
      <table className="cs-table">
        <thead>
          <tr>
            {block.head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 7: 寫 CompareBlock 與 BlockRenderer**

`CompareBlock.tsx`：

```tsx
import type { Block } from "@/data/cheatsheets/types";

import { BlockRenderer } from "./BlockRenderer";

type CompareBlock = Extract<Block, { kind: "compare" }>;

/** 並排比較卡；每張卡可內嵌其他原語，限一層（由測試把關不得再含 compare）。 */
export function CompareBlock({ block }: { block: CompareBlock }) {
  return (
    <div className="cs-compare">
      {block.items.map((item) => (
        <article key={item.name} className="cs-compare__card">
          <h4 className="cs-compare__name">{item.name}</h4>
          {item.blocks.map((inner, index) => (
            <BlockRenderer key={`${inner.kind}-${index}`} block={inner} />
          ))}
        </article>
      ))}
    </div>
  );
}
```

`BlockRenderer.tsx`：

```tsx
import type { Block } from "@/data/cheatsheets/types";

import { CompareBlock } from "./CompareBlock";
import { FlowBlock } from "./FlowBlock";
import { ListBlock } from "./ListBlock";
import { MetricsBlock } from "./MetricsBlock";
import { TableBlock } from "./TableBlock";

/** 依 kind 分派到對應的原語元件。 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "metrics":
      return <MetricsBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "flow":
      return <FlowBlock block={block} />;
    case "compare":
      return <CompareBlock block={block} />;
    case "table":
      return <TableBlock block={block} />;
  }
}
```

- [ ] **Step 8: 執行測試，確認它通過**

Run: `cd frontend && npx vitest run src/components/CheatSheet/`
Expected: PASS（5 個測試）

- [ ] **Step 9: 提交**

```bash
cd /Users/wangzhilin/interviewHelpMe
git add frontend/src/components/CheatSheet/
git commit -m "feat: add the five cheat sheet layout primitives

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: 速查表骨架元件與樣式

**Files:**
- Create: `frontend/src/components/CheatSheet/index.tsx`
- Create: `frontend/src/components/CheatSheet/index.css`
- Test: `frontend/src/components/CheatSheet/CheatSheet.test.tsx`

**Interfaces:**
- Consumes: Task 1 的 `CheatSheet` 型別、Task 3 的 `BlockRenderer`
- Produces: `function CheatSheetView({ sheet }: { sheet: CheatSheet }): JSX.Element`

**命名說明：** 元件叫 `CheatSheetView` 而非 `CheatSheet`，避免與同名的型別撞名。

- [ ] **Step 1: 寫失敗的測試**

建立 `frontend/src/components/CheatSheet/CheatSheet.test.tsx`：

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { CheatSheet } from "@/data/cheatsheets/types";

import { CheatSheetView } from "./index";

afterEach(cleanup);

const sheet: CheatSheet = {
  slug: "demo",
  title: "示範速查表",
  summary: "一句話說明",
  tags: ["標籤 A"],
  sections: [
    {
      title: "第一區",
      accent: "cyan",
      blocks: [{ kind: "list", items: ["重點一"] }],
    },
  ],
};

describe("CheatSheetView", () => {
  it("顯示標題、區塊標題與區塊內容", () => {
    render(<CheatSheetView sheet={sheet} />);

    expect(screen.getByRole("heading", { name: "示範速查表" })).toBeInTheDocument();
    expect(screen.getByText("第一區")).toBeInTheDocument();
    expect(screen.getByText("重點一")).toBeInTheDocument();
  });

  it("不使用 dangerouslySetInnerHTML", () => {
    // 全站目前 0 處。資料雖由我們自己撰寫，仍維持這條界線，
    // 免得日後有人把外部資料接進同一個渲染器時破功。
    const source = CheatSheetView.toString();
    expect(source).not.toContain("dangerouslySetInnerHTML");
  });
});
```

- [ ] **Step 2: 執行測試，確認它失敗**

Run: `cd frontend && npx vitest run src/components/CheatSheet/CheatSheet.test.tsx`
Expected: FAIL — `Failed to resolve import "./index"`

- [ ] **Step 3: 寫元件**

建立 `frontend/src/components/CheatSheet/index.tsx`：

```tsx
import type { CheatSheet } from "@/data/cheatsheets/types";

import { BlockRenderer } from "./blocks/BlockRenderer";

import "./index.css";

export interface CheatSheetViewProps {
  sheet: CheatSheet;
}

/** 一張速查表：標題 + 若干區塊，每個區塊帶自己的強調色。 */
export function CheatSheetView({ sheet }: CheatSheetViewProps) {
  return (
    <article className="cs-sheet">
      <header className="cs-sheet__head">
        <h1 className="page-title">{sheet.title}</h1>
        <p className="cs-sheet__summary">{sheet.summary}</p>
      </header>

      <div className="cs-sheet__sections">
        {sheet.sections.map((section) => (
          <section
            key={section.title}
            className={`cs-section cs-section--${section.accent ?? "cyan"}`}
          >
            <h2 className="cs-section__title">{section.title}</h2>
            <div className="cs-section__body">
              {section.blocks.map((block, index) => (
                <BlockRenderer key={`${block.kind}-${index}`} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: 寫樣式**

建立 `frontend/src/components/CheatSheet/index.css`：

```css
/* 一張速查表 */
.cs-sheet__summary {
  margin-block: 8px 0;
  color: var(--ink-muted);
}

.cs-sheet__sections {
  display: grid;
  gap: 18px;
  margin-block-start: 24px;
}

/* 區塊：左緣能量條標示強調色，與 bank-card 的語彙一致 */
.cs-section {
  --accent: var(--cyan);

  position: relative;
  padding: 18px 18px 16px 22px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  overflow: hidden;
}

.cs-section--cyan { --accent: var(--cyan); }
.cs-section--violet { --accent: var(--violet); }
.cs-section--amber { --accent: var(--amber); }
.cs-section--rose { --accent: var(--rose); }
.cs-section--lime { --accent: var(--lime); }

.cs-section::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 3px;
  background: var(--accent);
}

.cs-section__title {
  margin: 0 0 12px;
  color: var(--accent);
  font-size: 1.05rem;
}

.cs-section__body {
  display: grid;
  gap: 14px;
}

/* metrics */
.cs-metrics {
  display: grid;
  gap: 8px;
  margin: 0;
}

.cs-metric {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.cs-metric__label {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgb(255 255 255 / 8%);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
}

.cs-metric__body {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0;
}

.cs-metric__value {
  color: var(--ink);
  font-weight: 600;
}

.cs-metric__note {
  color: var(--ink-faint);
  font-size: 0.85rem;
}

/* list */
.cs-list {
  margin: 0;
  padding-inline-start: 20px;
  color: var(--ink-muted);
}

.cs-list li + li {
  margin-block-start: 4px;
}

.cs-list--warning {
  padding: 10px 12px 10px 30px;
  border: 1px solid rgb(251 191 36 / 30%);
  border-radius: 8px;
  background: rgb(251 191 36 / 8%);
  list-style-position: inside;
}

/* flow */
.cs-flow {
  display: grid;
  justify-items: center;
  gap: 0;
}

.cs-flow__layer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.cs-flow__link {
  width: 1px;
  height: 16px;
  background: var(--line-strong);
}

.cs-flow__node {
  --node: var(--cyan);

  padding: 6px 12px;
  border: 1px solid color-mix(in srgb, var(--node) 45%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--node) 12%, transparent);
  color: var(--ink);
  font-size: 0.85rem;
  white-space: nowrap;
}

.cs-flow__node--cyan { --node: var(--cyan); }
.cs-flow__node--violet { --node: var(--violet); }
.cs-flow__node--amber { --node: var(--amber); }
.cs-flow__node--rose { --node: var(--rose); }
.cs-flow__node--lime { --node: var(--lime); }

/* compare */
.cs-compare {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.cs-compare__card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel-raised);
}

.cs-compare__name {
  margin: 0;
  color: var(--ink);
  font-size: 0.95rem;
}

/* table：窄螢幕橫向捲動，頁面本體不得橫向捲動 */
.cs-table-wrap {
  overflow-x: auto;
}

.cs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.cs-table th,
.cs-table td {
  padding: 8px 10px;
  border-block-end: 1px solid var(--line);
  text-align: start;
}

.cs-table th {
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
}

.cs-table td {
  color: var(--ink-muted);
}

/* 延伸題目 */
.cs-related {
  margin-block-start: 28px;
}

.cs-related ul {
  margin: 8px 0 0;
  padding-inline-start: 20px;
}

.cs-related li + li {
  margin-block-start: 4px;
}
```

- [ ] **Step 5: 執行測試，確認它通過**

Run: `cd frontend && npx vitest run src/components/CheatSheet/`
Expected: PASS（7 個測試）

- [ ] **Step 6: 提交**

```bash
cd /Users/wangzhilin/interviewHelpMe
git add frontend/src/components/CheatSheet/
git commit -m "feat: add cheat sheet shell component and styling

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: 另外兩張速查表

第一批要三張，各驗證一種版面型態：系統設計（Task 1 已完成）驗證 metrics/list/flow/compare，快取驗證 flow/compare/table，複雜度驗證 table/list-warning。

**Files:**
- Create: `frontend/src/data/cheatsheets/caching.ts`
- Create: `frontend/src/data/cheatsheets/complexity.ts`
- Modify: `frontend/src/data/cheatsheets/index.ts`

**Interfaces:**
- Consumes: Task 1 的 `CheatSheet` 型別
- Produces: `export const caching: CheatSheet`、`export const complexity: CheatSheet`；`cheatSheets` 陣列擴充為三張

- [ ] **Step 1: 寫快取速查表**

建立 `frontend/src/data/cheatsheets/caching.ts`：

```ts
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
```

- [ ] **Step 2: 寫複雜度速查表**

建立 `frontend/src/data/cheatsheets/complexity.ts`：

```ts
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
```

- [ ] **Step 3: 更新 index**

把 `frontend/src/data/cheatsheets/index.ts` 改成：

```ts
import { caching } from "./caching";
import { complexity } from "./complexity";
import { systemDesign } from "./system-design";
import type { CheatSheet } from "./types";

/** 全部速查表，順序即列表頁顯示順序。 */
export const cheatSheets: CheatSheet[] = [systemDesign, caching, complexity];

export function getCheatSheet(slug: string): CheatSheet | undefined {
  return cheatSheets.find((sheet) => sheet.slug === slug);
}

export type { Accent, Block, CheatSheet, FlowNode, Section } from "./types";
```

- [ ] **Step 4: 執行測試**

Run: `cd frontend && npx vitest run src/data/cheatsheets/`
Expected: PASS（8 個測試，現在涵蓋三張速查表）

- [ ] **Step 5: 提交**

```bash
cd /Users/wangzhilin/interviewHelpMe
git add frontend/src/data/cheatsheets/
git commit -m "feat: add caching and complexity cheat sheets

Between them the three sheets exercise all five primitives: system
design covers metrics/list/flow/compare, caching covers flow/compare/
table, complexity covers table and the warning list variant.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: 列表頁與詳情頁

**Files:**
- Create: `frontend/src/components/CheatSheetList/index.tsx`
- Create: `frontend/src/components/CheatSheetList/index.css`
- Create: `frontend/src/app/cheatsheets/page.tsx`
- Create: `frontend/src/app/cheatsheets/[slug]/page.tsx`
- Modify: `frontend/src/config/menu.ts`
- Test: `frontend/src/components/CheatSheetList/CheatSheetList.test.tsx`

**Interfaces:**
- Consumes: Task 1/5 的 `cheatSheets`、`getCheatSheet`；Task 4 的 `CheatSheetView`
- Produces: `function CheatSheetList({ sheets }: { sheets: CheatSheet[] }): JSX.Element`

- [ ] **Step 1: 寫失敗的測試**

建立 `frontend/src/components/CheatSheetList/CheatSheetList.test.tsx`：

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { CheatSheet } from "@/data/cheatsheets/types";

import { CheatSheetList } from "./index";

afterEach(cleanup);

const sheets: CheatSheet[] = [
  {
    slug: "demo",
    title: "示範速查表",
    summary: "一句話說明",
    tags: ["標籤 A"],
    sections: [{ title: "區", blocks: [{ kind: "list", items: ["x"] }] }],
  },
];

describe("CheatSheetList", () => {
  it("顯示標題、說明與標籤", () => {
    render(<CheatSheetList sheets={sheets} />);

    expect(screen.getByText("示範速查表")).toBeInTheDocument();
    expect(screen.getByText("一句話說明")).toBeInTheDocument();
    expect(screen.getByText("標籤 A")).toBeInTheDocument();
  });

  it("連結指向該速查表的頁面", () => {
    render(<CheatSheetList sheets={sheets} />);

    expect(screen.getByRole("link", { name: /示範速查表/ })).toHaveAttribute(
      "href",
      "/cheatsheets/demo",
    );
  });
});
```

- [ ] **Step 2: 執行測試，確認它失敗**

Run: `cd frontend && npx vitest run src/components/CheatSheetList/`
Expected: FAIL — `Failed to resolve import "./index"`

- [ ] **Step 3: 寫列表元件**

建立 `frontend/src/components/CheatSheetList/index.tsx`：

```tsx
import Link from "next/link";
import { Tag } from "antd";

import type { CheatSheet } from "@/data/cheatsheets/types";

import "./index.css";

export interface CheatSheetListProps {
  sheets: CheatSheet[];
}

/** 速查表列表：每張一個卡片，點進去看完整內容。 */
export function CheatSheetList({ sheets }: CheatSheetListProps) {
  return (
    <div className="cs-list-grid">
      {sheets.map((sheet) => (
        <Link key={sheet.slug} href={`/cheatsheets/${sheet.slug}`} className="cs-card">
          <h2 className="cs-card__title">{sheet.title}</h2>
          <p className="cs-card__summary">{sheet.summary}</p>
          <div className="cs-card__tags">
            {sheet.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          <span className="cs-card__meta">{sheet.sections.length} 個區塊</span>
        </Link>
      ))}
    </div>
  );
}
```

建立 `frontend/src/components/CheatSheetList/index.css`：

```css
.cs-list-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  margin-block-start: 18px;
}

.cs-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  color: var(--ink);
  transition:
    transform var(--normal) var(--ease),
    border-color var(--fast) var(--ease);
}

.cs-card:hover,
.cs-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  color: var(--ink);
}

.cs-card__title {
  margin: 0;
  color: var(--cyan);
  font-size: 1.05rem;
}

.cs-card__summary {
  flex: 1;
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.9rem;
}

.cs-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cs-card__meta {
  color: var(--ink-faint);
  font-size: 0.8rem;
}
```

- [ ] **Step 4: 執行測試，確認它通過**

Run: `cd frontend && npx vitest run src/components/CheatSheetList/`
Expected: PASS（2 個測試）

- [ ] **Step 5: 寫兩個頁面**

建立 `frontend/src/app/cheatsheets/page.tsx`：

```tsx
import { CheatSheetList } from "@/components/CheatSheetList";
import { cheatSheets } from "@/data/cheatsheets";

/** 速查表列表頁。 */
export default function CheatSheetsPage() {
  return (
    <div id="cheatSheetsPage" className="max-width-content">
      <header>
        <p className="hud-eyebrow">Cheat Sheets // 速查表</p>
        <h1 className="page-title">
          面試速查表
          <span className="page-title__sub font-display">{cheatSheets.length} sheets</span>
        </h1>
      </header>
      <CheatSheetList sheets={cheatSheets} />
    </div>
  );
}
```

建立 `frontend/src/app/cheatsheets/[slug]/page.tsx`：

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import { CheatSheetView } from "@/components/CheatSheet";
import { cheatSheets, getCheatSheet } from "@/data/cheatsheets";

type CheatSheetPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return cheatSheets.map((sheet) => ({ slug: sheet.slug }));
}

/** 速查表詳情頁。 */
export default function CheatSheetPage({ params }: CheatSheetPageProps) {
  const sheet = getCheatSheet(params.slug);

  if (!sheet) {
    notFound();
  }

  return (
    <div id="cheatSheetPage" className="max-width-content">
      <CheatSheetView sheet={sheet} />

      {sheet.relatedQuestions && sheet.relatedQuestions.length > 0 ? (
        <section className="cs-related">
          <p className="hud-eyebrow">Related // 延伸題目</p>
          <ul>
            {sheet.relatedQuestions.map((ref) => {
              const [category, questionSlug] = ref.split("/");
              return (
                <li key={ref}>
                  <Link href={`/category/${category}/question/${questionSlug}`}>{ref}</Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: 加上導覽項**

修改 `frontend/src/config/menu.ts`，在 `menus` 陣列的 `/questions` 之後加入：

```ts
  {
    path: "/cheatsheets",
    name: "速查表",
  },
```

- [ ] **Step 7: 跑全部測試與建置**

Run: `cd frontend && npm test`
Expected: 全部 PASS（既有 179 + 本次新增的 17 個）

Run: `cd frontend && npm run build`
Expected: 建置成功，輸出含 `/cheatsheets` 與三個 `/cheatsheets/<slug>` 靜態頁

- [ ] **Step 8: 提交**

```bash
cd /Users/wangzhilin/interviewHelpMe
git add frontend/src/components/CheatSheetList/ frontend/src/app/cheatsheets/ frontend/src/config/menu.ts
git commit -m "feat: add cheat sheet list and detail pages

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: 在瀏覽器中驗證

測試通過不代表版面是對的。這一步用實際畫面確認。

**Files:** 無（僅驗證，發現問題才改）

**Interfaces:**
- Consumes: Task 6 完成的頁面
- Produces: 無

- [ ] **Step 1: 啟動開發伺服器並開啟列表頁**

建立 `.claude/launch.json`（若尚未存在）：

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "interview-frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

用 `preview_start` 啟動，導向 `/cheatsheets`。

- [ ] **Step 2: 檢查主控台與版面**

用 `read_console_messages` 確認無錯誤；用 `computer` 截圖確認卡片排列正常。

- [ ] **Step 3: 逐一檢查三張速查表**

導向 `/cheatsheets/system-design`、`/cheatsheets/caching`、`/cheatsheets/complexity`，各截一張圖。要確認：

- 區塊的強調色有區分，左緣能量條有出現
- `flow` 的節點與連接線對齊，不會歪掉
- `compare` 的卡片在寬螢幕並排、窄螢幕堆疊
- `table` 超寬時是表格自己橫向捲動，**頁面本體不得橫向捲動**

- [ ] **Step 4: 檢查窄螢幕**

用 `resize_window` 設 `preset: "mobile"`（375×812），重新檢查三張。確認沒有內容溢出。

- [ ] **Step 5: 修正發現的問題**

若版面有問題，改 `frontend/src/components/CheatSheet/index.css`，重新整理確認。

- [ ] **Step 6: 提交修正（若有）**

```bash
cd /Users/wangzhilin/interviewHelpMe
git add frontend/src/components/
git commit -m "fix: correct cheat sheet layout issues found in the browser

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## 完成後的狀態

- `/cheatsheets` 列出三張速查表，`/cheatsheets/<slug>` 顯示完整內容
- 五個版面原語各有渲染測試，資料規則有 8 個完整性測試
- 新增一張速查表 = 新增一個資料檔 + 加進 `index.ts` 的陣列，不必碰渲染程式碼
- 全站仍為 0 處 `dangerouslySetInnerHTML`、0 個對外請求
