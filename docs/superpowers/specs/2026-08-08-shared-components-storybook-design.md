# InterviewHelpMe 共用元件與 Storybook 設計

**日期：** 2026-08-08  
**狀態：** 待實作（設計已與使用者確認）  
**範圍：** 新建 `frontend/` 共用元件層 + Storybook 8（CSF3 + Autodocs）

## 背景與目標

InterviewHelpMe 目前沒有自有前端，僅有 `content/` 題庫、`backend/sql/schema.sql`，以及 `reference/mianshiya-next` 參考實作。參考專案的共用元件（`TagList`、`QuestionCard`、`QuestionList`、`MdViewer` 等）直接綁定 `API.QuestionVO`、簽到 hook、Next `Link`，不利於 Storybook 與自架演進。

本設計目標：

1. 以 `mianshiya-next` 為**模式參考**（不複製程式碼），為 InterviewHelpMe **新建**元件庫。
2. UI 底層採用 **Ant Design**（對齊參考專案）。
3. 第一波做精簡核心業務元件，並附 **CSF Stories + Autodocs** 互動說明。

## 決策摘要

| 項目 | 選擇 |
|------|------|
| 對齊對象 | 參考 `mianshiya-next`，新建 InterviewHelpMe 元件（方案 A） |
| UI 庫 | Ant Design（非 PrimeReact） |
| 第一波範圍 | 精簡核心（見下方元件清單） |
| Storybook | CSF3 + Autodocs（Controls／Actions／Props 表） |
| 專案結構 | App 內 `frontend/` 元件目錄（方案 1），非獨立 monorepo package |

## 架構

### 目錄結構

```
interviewHelpMe/
├── frontend/                      # Next.js 14 App Router + Ant Design
│   ├── .storybook/                # Storybook 8（@storybook/nextjs）
│   ├── src/
│   │   ├── app/                   # 頁面（本階段可極簡 stub）
│   │   ├── components/
│   │   │   ├── TagList/
│   │   │   ├── DifficultyBadge/
│   │   │   ├── QuestionCard/
│   │   │   ├── QuestionList/
│   │   │   ├── MdViewer/
│   │   │   ├── CategoryNav/
│   │   │   ├── EmptyState/
│   │   │   ├── LoadingState/
│   │   │   └── _fixtures/         # Story／測試共用假資料
│   │   └── types/                 # 與 schema 對齊的前端型別
│   └── package.json
├── content/                       # 既有題庫（不變）
├── backend/sql/                   # schema 為型別對齊來源
└── docs/superpowers/specs/        # 本設計文件
```

### 設計原則

1. **純資料 props**：元件只接收 `Question`／`Category` 等前端型別，不綁後端 OpenAPI 型別、不綁簽到等副作用。
2. **可注入導航**：使用 `href`／`getHref`／`onNavigate`，Storybook 不依賴真實 Next router。
3. **無隱藏網路呼叫**：展示元件不在 mount 時打 API。
4. **Markdown 唯讀**：`MdViewer` 可沿用 bytemd Viewer + GFM／highlight 外掛；編輯器不在第一波。

## 資料型別

對齊 `backend/sql/schema.sql`：

```ts
type Difficulty = 'easy' | 'medium' | 'hard'

type Question = {
  id: string
  slug: string
  title: string
  difficulty: Difficulty
  tags: string[]
  content: string       // markdown
  answer?: string       // markdown；列表場景可不帶
  categorySlug: string
}

type Category = {
  slug: string
  nameZh: string
  description?: string
  questionCount?: number
}
```

## 元件清單與 API

### 第一波（必做）

| 元件 | 主要 props | 行為 |
|------|------------|------|
| `TagList` | `tags: string[]`，`max?: number` | 超過 `max` 顯示 `+N`；空陣列不渲染 |
| `DifficultyBadge` | `difficulty: Difficulty` | easy／medium／hard 對應色票 |
| `QuestionCard` | `question`，`showAnswer?: boolean`，`href?` | 標題＋難度＋標籤＋內容；答案可隱藏（練習模式） |
| `QuestionList` | `questions`，`getHref?(q)`，`emptyText?` | 列表項含難度與標籤；空資料用 `EmptyState` |
| `MdViewer` | `value: string` | 唯讀 Markdown |
| `CategoryNav` | `categories`，`activeSlug?`，`getHref?(c)` | 分類導覽與 active 態 |
| `EmptyState` | `title`，`description?`，`action?` | 統一空狀態 |
| `LoadingState` | `tip?`，`fullscreen?: boolean` | Spin／骨架 |

### 明確不做（第一波）

- 收藏、簽到、留言、富文本編輯（`MdEditor`）
- 後台 `QuestionTable`／CRUD Modal
- 完整題庫瀏覽頁與練習流程頁（可留 stub）

## Storybook 規約

### 技術

- Storybook 8 + `@storybook/nextjs`
- 全域 decorator：`ConfigProvider`（建議 `zh_TW`）+ Ant Design 樣式
- 每個元件旁 `ComponentName.stories.tsx`，`tags: ['autodocs']`
- 說明文字：繁體中文 JSDoc；英文字識別名維持英文

### 每個元件最低 Story 集合

| Story | 用途 |
|-------|------|
| `Default` | Happy path |
| `Empty`／適用的 Loading | 邊界 |
| `LongContent` 或 `ManyTags` | 溢出／壓力 |
| 業務變體 | 如 `QuestionCard`：`WithAnswer`、`PracticeMode` |

### 互動

- **Controls**：字串、布林、`difficulty` select、`tags` 等可調
- **Actions**：導航／按鈕點擊寫入 Actions panel
- **Docs**：Autodocs（Description + Args table + Canvas）

### 假資料與腳本

- `src/components/_fixtures/questions.ts`（及 categories）供故事與日後測試共用
- `npm run storybook`／`npm run build-storybook`

## 與參考專案的差異

| 參考（mianshiya-next） | InterviewHelpMe |
|----------------------|-----------------|
| `API.QuestionVO` | 自有 `Question` 型別（對齊 schema） |
| `QuestionCard` 內呼叫簽到 hook | 禁止；副作用由頁面／hook 層處理 |
| `Link` 硬編碼 `/bank/...` 路徑 | `getHref`／`href` 注入 |
| 無難度徽章 | 新增 `DifficultyBadge`（schema 有 `difficulty`） |
| 無 Storybook | Storybook 8 + Autodocs |

## 成功標準

1. `frontend/` 可安裝依賴並啟動 Storybook。
2. 上表八個元件皆有可互動 Stories 與 Autodocs 頁。
3. 元件單元不依賴真實後端；fixtures 即可完整演示。
4. 型別與 `schema.sql` 的 category／question／difficulty／tags 語意一致。

## 實作順序（供後續 plan 使用）

1. Scaffold `frontend/`（Next.js + Ant Design + TypeScript）
2. 建立 `types` 與 `_fixtures`
3. 實作元件（由小到大：`TagList` → `DifficultyBadge` → `EmptyState`／`LoadingState` → `MdViewer` → `CategoryNav` → `QuestionList` → `QuestionCard`）
4. 設定 Storybook + decorator + 各元件 stories
5. 驗證 `storybook`／`build-storybook` 可跑通

## 風險與限制

- 本階段不交付完整產品頁；以元件庫與文件為準。
- 不複製 `mianshiya-next` 原始碼或題目內容；僅借鑑職責切分與 Ant Design 用法。
- Markdown 樣式（github-markdown-css）需在 Storybook preview 一併引入，避免 Docs 與 Canvas 外觀不一致。
