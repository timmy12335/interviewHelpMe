# InterviewHelpMe GitHub Pages 練習站設計

**日期：** 2026-08-09  
**狀態：** 待使用者審閱  
**範圍：** 前端讀取 `content/` 題庫 → 靜態匯出 → 部署 GitHub Pages；無後端

## 背景與目標

InterviewHelpMe 已有：

- `content/`：約 11 類、240+ 題 Markdown（frontmatter 對齊 `schema.sql`）
- `frontend/`：共用元件（`CategoryNav`、`QuestionList`、`QuestionCard` 含練習模式等）與 Storybook
- `backend/sql/schema.sql`：僅草稿，**無執行中後端**

使用者目標：在 **GitHub Pages**（例如 `username.github.io/interviewHelpMe`）用瀏覽器練題。Pages 只能託管靜態資產，因此採「建置時讀題庫、前端靜態匯出」，不做 API／MySQL／docker-compose。

### 成功標準

1. 本地 `npm run dev` 可瀏覽全部分類與題目，並以練習模式隱藏／顯示答案。
2. `npm run build`（靜態匯出）產出可部署的 `out/`（或同等目錄）。
3. 透過 GitHub Actions，push 到預設分支後自動更新 GitHub Pages。
4. 不依賴任何後端服務；題庫來源為 repo 內 `content/`。

## 決策摘要

| 項目 | 選擇 |
|------|------|
| 託管 | GitHub Pages |
| 資料來源 | 建置時解析 `content/**/*.md` |
| 渲染 | 既有 Next.js 14 App Router + 共用元件 |
| 匯出 | `output: 'export'`（靜態 HTML） |
| 後端／DB／docker-compose | 本階段不做 |
| 登入／雲端收藏 | 不做；進度可選本機 `localStorage`（非必做） |

## 架構

```
interviewHelpMe/
├── content/                         # 題庫（唯一真實來源）
├── frontend/
│   ├── next.config.mjs              # output: 'export'、basePath／assetPrefix
│   ├── src/
│   │   ├── lib/content/             # 讀檔、解析 frontmatter、切題目／答案
│   │   ├── app/
│   │   │   ├── page.tsx                               # 分類首頁
│   │   │   └── category/[slug]/
│   │   │       ├── page.tsx                           # 該分類題目列表
│   │   │       └── question/[questionSlug]/page.tsx   # 題目詳情（預設練習模式）
│   │   ├── components/              # 既有共用元件（沿用）
│   │   └── types/question.ts        # 沿用 Question／Category
│   └── package.json
├── .github/workflows/pages.yml      # build frontend → deploy Pages
└── docs/superpowers/specs/          # 本設計
```

建置流程：

1. Content loader 掃描 `../../content/<category>/*.md`（略過各目錄 `README.md`）。
2. 解析 YAML frontmatter → `Question` 欄位；正文依標題切出「題目」與「答案」區塊。
3. 產生靜態路由：首頁、每個分類頁、每題詳情頁。
4. 產物部署至 GitHub Pages。

## 內容解析規則

### Frontmatter（已存在）

對應 `Question`：

| frontmatter | 型別欄位 |
|-------------|---------|
| `id` | `id` |
| `slug` | `slug` |
| `title` | `title` |
| `difficulty` | `difficulty` |
| `tags` | `tags` |
| `category` | `categorySlug` |

### 正文切分

題庫慣用結構：

- `# 題目` … 直到下一個二級標題之前 → `content`（練習時顯示）
- 自 `## 核心答案` 起至文末（含詳細解析、面試回答方式、常見追問、相關）→ `answer`（練習模式預設隱藏）

若缺 `# 題目` 或 `## 核心答案`，建置應失敗並印出路徑，避免靜默產出半殘頁面。

### 分類中繼資料

分類名稱優先對齊 `backend/sql/schema.sql` 的 `INSERT INTO category`（`slug`／`name_zh`／`sort_order`）。`questionCount` 由掃描結果計算。各 `content/<cat>/README.md` 可選作 `description`（非必做；可先寫死 schema 名稱）。

## 路由與 UI

| 路由 | 行為 |
|------|------|
| `/` | `CategoryNav`／分類卡片列表 |
| `/category/[slug]` | `QuestionList`；`getHref` → 題目詳情 |
| `/category/[slug]/question/[questionSlug]` | `QuestionCard`，預設 `showAnswer={false}`，提供「顯示／隱藏推薦答案」切換 |

版面：沿用 Ant Design；App `layout` 含簡易站名與返回首頁連結。不引入參考專案的簽到／收藏 hook。

### `basePath`

若 Pages 網址為 `https://<user>.github.io/<repo>/`，需設定：

- `basePath: '/<repo>'`
- `assetPrefix: '/<repo>'`（若需要）

repo 名稱以實際 GitHub remote 為準；可用環境變數在 CI 注入，避免寫死錯誤路徑。本地 `dev` 可不設 `basePath`（或文件說明兩種模式）。

## GitHub Pages 部署

1. Repo Settings → Pages：Source = **GitHub Actions**。
2. Workflow 大綱：
   - checkout
   - `frontend` 安裝依賴、`npm run build`
   - 上傳 `frontend/out`（或設定的 dist）為 Pages artifact 並 deploy
3. 觸發：`push` 到預設分支（目前 repo 為 `master`）；可含 `workflow_dispatch`。

建置時必須能讀到 repo 根目錄的 `content/`（checkout 整個 repo，在 `frontend` 目錄執行 build，loader 使用相對於 monorepo 根的路徑）。

## 明確不做

- 後端 API、MySQL、docker-compose
- 使用者登入、雲端收藏、留言
- MdEditor／後台 CRUD
- 全文搜尋服務（可選：純前端關鍵字過濾，非本階段必做）
- 將 wiki 連結 `[[...]]` 轉成站內路由（可保留原文；後續再優化）

## 風險與限制

| 風險 | 緩解 |
|------|------|
| 靜態匯出與部分 Next 功能不相容 | 練習頁僅用 SSG／Client 互動（答案切換用 client component）；禁止依賴 Node runtime 的 route handlers |
| `basePath` 設錯導致 CSS／連結 404 | CI 用 repo 名注入；文件寫明驗證步驟 |
| Markdown 體量大、建置變慢 | 可接受；題數約數百、單次建置應仍在合理範圍 |
| 練習進度無法跨裝置 | 接受；選做 localStorage |

## 與前一階段的關係

- 延續 [2026-08-08 共用元件設計](./2026-08-08-shared-components-storybook-design.md)：頁面組裝既有元件，不重寫元件庫。
- 前一階段「不做完整練習頁」由本規格補齊。
- `schema.sql` 仍作型別／分類契約；真正資料以 `content/` 為準。

## 實作順序（供後續 plan）

1. Content loader（解析 + 單元測試／幾個真實檔抽樣）
2. 靜態路由頁面（首頁 → 分類 → 題目詳情 + 答案切換）
3. `next.config` 靜態匯出與 `basePath` 策略
4. GitHub Actions Pages workflow + README 使用說明
5. 手動驗證本地 build 與（可選）Pages 預覽網址

## 驗證清單

- [ ] 本地可開啟至少 2 個不同分類、各 1 題，練習模式可切換答案
- [ ] `npm run build` 成功且 `out/` 含對應 HTML
- [ ] 以 `basePath` 模擬子路徑時，靜態資源與內部連結正常（或文件載明本地免 basePath、CI 才設）
- [ ] Workflow 檔存在且步驟與本設計一致（實際部署需使用者在 GitHub 開通 Pages）
