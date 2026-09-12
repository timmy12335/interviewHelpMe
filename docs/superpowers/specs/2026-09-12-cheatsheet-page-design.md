# 面試速查表（Cheat Sheet）頁面設計

**日期：** 2026-09-12
**狀態：** 設計完成，待實作
**範圍：** 新增 `/cheatsheets` 路由與 `CheatSheet` 元件；新增 `frontend/src/data/cheatsheets/` 結構化資料；`config/menu.ts` 新增導覽項

## 背景與目標

題庫目前有 902 題，內容是**散文式的深度說明**——適合精讀，不適合臨場速記。面試前一晚想快速把「高可用有哪幾種做法」掃過一遍時，得點開好幾題各自讀幾百字。

使用者要的是 ByteByteGo 那種**單頁資訊圖表**：一眼看完一個主題的骨架，需要細節時再回頭查題庫。

### 現況量測

| 項目 | 現況 | 對設計的影響 |
|------|------|------------|
| 前端框架 | Next.js 14 靜態匯出、Ant Design 5 | 需 `generateStaticParams` |
| 設計 token | 深色 HUD：`--void #04060e`、cyan/violet/amber/rose/lime | 速查表沿用，不另建色系 |
| `content/` 目錄語意 | **每個子目錄都被當成題目分類** | 速查表資料不能放 `content/` |
| `dangerouslySetInnerHTML` | 全站 **0 處** | 新功能維持 0 |
| 對外請求／分析工具 | **無**，純靜態 | 新功能維持無 |

第三列是關鍵限制：`loadContent.ts:28` 與 `contentIntegrity.test.ts` 都用「掃目錄」認分類，且有測試斷言 `CATEGORY_META` 必須與目錄一一對應。新建 `content/cheatsheets/` 會同時弄壞測試並讓 loader 嘗試把速查表當題目解析。

### 成功標準

1. 一張速查表能在**單一畫面捲動內**掃完一個主題的骨架。
2. 新增一張速查表不需要碰渲染程式碼——只寫資料。
3. 速查表能連回題庫對應題目，讓「速記 → 深挖」是一條路徑。
4. 全站無外連、無 `dangerouslySetInnerHTML` 的現況不被破壞。

## 決策摘要

| 項目 | 選擇 | 否決的替代方案 |
|------|------|--------------|
| 內容形式 | 手寫結構化 TypeScript 資料 | 圖片（不可搜尋、更新即重畫）、從題庫自動彙整（版面偏文字條列） |
| 資料位置 | `frontend/src/data/cheatsheets/` | `content/cheatsheets/`（破壞目錄掃描；需改動 179 個測試所倚賴的管線） |
| 視覺 | 沿用站上深色 HUD，骨架學 ByteByteGo | 淺底圖卡（需另維一套 token）、雙主題可切換（先不做） |
| 流程圖 | 分層節點 + CSS 連線 | 通用圖渲染（SVG 路徑計算，投入與收益不成比例） |
| 第一批範圍 | 3 張，各驗證一種版面型態 | 1 張（驗證不足）、6–8 張（原語未驗證就量產） |

**資料放前端而非 `content/` 的理由不只是省事**：速查表的資料本質上是**與渲染元件綁定的 view model**（「這是一張比較表」「這是三層節點」），和 markdown 題目那種可攜的散文不同。散文該放 `content/`，view model 該放元件旁邊。真要搬遷時，同一份結構換個載體是機械性的工作。

## 資料模型

```ts
export type Accent = "cyan" | "violet" | "amber" | "rose" | "lime";

export interface CheatSheet {
  slug: string;
  title: string;
  summary: string;              // 列表卡片用
  tags: string[];
  relatedQuestions?: string[];  // `<分類>/<檔名去掉 .md>`，例 "system-design/034-flash-sale-design"
  sections: Section[];
}

export interface Section {
  title: string;
  accent?: Accent;
  blocks: Block[];
}

export type Block =
  | { kind: "metrics"; items: { label: string; value: string; note?: string }[] }
  | { kind: "list"; variant?: "plain" | "numbered" | "warning"; items: string[] }
  | { kind: "flow"; layers: FlowNode[][] }
  | { kind: "compare"; items: { name: string; blocks: Block[] }[] }
  | { kind: "table"; head: string[]; rows: string[][] };

export interface FlowNode { label: string; tone?: Accent }
```

`relatedQuestions` 讓速查表不只是裝飾——看完骨架想深挖時有路可走，也讓這個功能與既有的 902 題產生連結而非各自獨立。

## 版面原語

五個原語，從參考圖拆解而來：

| 原語 | 對應參考圖 | 驗證它的 sheet |
|------|-----------|--------------|
| `metrics` | `99.99%` → 每天 8.64 秒、RTO、RPO | 系統設計 |
| `list` | Principles: 1. redundancy 2. no SPOF | 系統設計、複雜度 |
| `flow` | API Gateway → Order Service → Payment Service | 系統設計、快取 |
| `compare` | Hot-Hot ／ Hot-Warm 並排 | 系統設計、快取 |
| `table` | 欄列對照 | 快取、複雜度 |

**`flow` 刻意不做通用圖渲染。** 簡化為「分層節點」：每層放若干節點，**相鄰兩層之間全連接**（上層每個節點都連到下層每個節點）。參考圖上的小圖都是兩到三層的扇出/匯聚，這個模型足以表達，而且純 CSS 可畫，不需要 SVG 路徑計算與碰撞處理。

**`compare` 的每張卡可內嵌其他原語，限一層、不遞迴。** 這是為了表達「Hot-Hot 卡片裡有一張小流程圖」。限制深度避免資料變成難以閱讀的巢狀樹。

## 路由與檔案結構

```
/cheatsheets          列表（卡片 + 標籤）
/cheatsheets/[slug]   單張速查表

frontend/src/data/cheatsheets/
  types.ts            上述型別
  index.ts            cheatSheets 陣列 + getCheatSheet(slug)
  system-design.ts    分區 + 指標 + 方案（含流程圖）
  caching.ts          流程圖 + 比較表
  complexity.ts       純表格 + 邊界提示

frontend/src/components/CheatSheet/
  index.tsx           整張 sheet 的骨架
  blocks/             每個原語一個檔案
  index.css

frontend/src/app/cheatsheets/
  page.tsx
  [slug]/page.tsx     generateStaticParams
```

原語各自成檔而非塞進一個 `blocks.tsx`：五個原語合計約 250 行，單檔尚可但已接近專案「200–400 行」的上緣，且各原語彼此無關，分檔後改一個不會碰到其他。

## 安全與隱私

此功能為純靜態內容，無使用者輸入、無後端、無資料收集。具體約束：

1. **不引入 `dangerouslySetInnerHTML`。** 全站目前 0 處，速查表全部走 React 的預設跳脫。即使資料由我們自己撰寫、非使用者輸入，維持這條界線才不會在日後有人把外部資料接進同一個渲染器時破功。
2. **不引入任何對外請求**——無字型 CDN、無分析、無圖片外連。全站目前無外連，速查表不打破。
3. **內容不得含個資**：真實姓名、email、公司內部系統名稱、可辨識的事故細節一律不寫。速查表是技術參考，不需要這些。
4. **範例中不得出現任何憑證形狀的字串**，即使是假的。需要示意時用明顯的佔位符（`<API_KEY>`），網域一律用保留的 `example.com`，IP 用文件保留區段。理由是這類字串會被複製貼上，也會被掃描工具誤報。

## 測試策略

沿用專案「內容規則寫成測試」的慣例——獨立腳本會腐爛，測試會跟著 `npm test` 跑。

**資料完整性（新增 `cheatSheets.test.ts`）**

- slug 全站唯一，且符合 URL 安全字元
- 每個 section 至少一個 block（空區塊在畫面上是一塊空白，不會報錯）
- **`table` 每列欄數等於表頭欄數**——這種錯只會看成排版歪掉
- **`relatedQuestions` 指向真實存在的題目**，與既有 wiki 連結檢查同一精神
- `compare` 的 `items[].blocks` 不得再含 `compare`（限一層巢狀）

**渲染測試**

- 五個原語各一個測試，確認內容出現在畫面上
- 一個測試斷言渲染輸出不含 `dangerouslySetInnerHTML`（把安全約束變成機器檢查，而非靠記得）

## 不做的事

明確排除，避免範圍蔓延：

- **拖拉式編輯器**——資料用手寫，3 張的規模不值得做編輯器
- **PNG／圖片匯出**——想分享先用瀏覽器截圖
- **淺色主題**——先確認深色版方向正確
- **全文檢索**——列表頁的標籤篩選已足夠；真要搜尋應該接進既有的題目搜尋而非另做一套
