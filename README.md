# Interview Help Me

靜態面試練習站：從 `content/` 讀取 Markdown 題目，以 Next.js 靜態匯出部署至 GitHub Pages。

## 本地開發

```bash
cd frontend
npm ci
npm run dev
```

瀏覽 [http://localhost:3000](http://localhost:3000)。本地開發不需設定 `NEXT_PUBLIC_BASE_PATH`（預設為空）。

## 建置

```bash
cd frontend
npm ci
npm run build
```

產出靜態檔至 `frontend/out/`（已加入 `.gitignore`）。

若需模擬 GitHub Pages 子路徑部署：

```bash
NEXT_PUBLIC_BASE_PATH=/interviewHelpMe npm run build
npx serve out
```

## 測試

```bash
cd frontend
npm test
```

## GitHub Pages 部署

1. 合併至 `master` 後，workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) 會自動建置並部署。
2. 也可在 GitHub **Actions** 頁面手動觸發 **Deploy to GitHub Pages**（`workflow_dispatch`）。
3. 首次啟用：repo **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
4. 部署網址：`https://<username>.github.io/<repo-name>/`（workflow 以 `NEXT_PUBLIC_BASE_PATH=/<repo-name>` 建置）。

> 若 repo 為 `<username>.github.io` 根站，請將 workflow 中的 `NEXT_PUBLIC_BASE_PATH` 改為空字串。

## 專案結構

| 路徑 | 說明 |
|------|------|
| `content/` | Markdown 題目與分類 |
| `frontend/` | Next.js 靜態匯出前端 |

## 資料來源

題庫的**題目範圍與命題方向**參考下列公開的面試準備專案。內容本身是自行撰寫的——每題的
`source` frontmatter 標為 `original`（`real-interviews` 類別標為 `community`），**沒有複製
原文**，因此各來源專案的授權條款不及於本專案的內容。列在這裡是為了說明選題的依據，也方便
想往下深挖的人回到原始出處。

| 來源 | 涵蓋範圍 | 對應的分類 |
|------|----------|------------|
| [yangshun/tech-interview-handbook](https://github.com/yangshun/tech-interview-handbook) | 演算法題型與解題模式、行為面試、前端面試、求職流程 | `algorithms`、`behavioral`、`frontend` |
| [Snailclimb/JavaGuide](https://github.com/Snailclimb/JavaGuide) | Java 基礎與集合、併發、JVM、Spring、MySQL、Redis、計算機基礎、設計模式、分散式、高效能與高可用 | `java`、`java-concurrency`、`jvm`、`spring`、`database`、`redis`、`backend-engineering`、`system-design`、`computer-network`、`message-queue`、`design-patterns` |
| [yongxinz/backend-interview](https://github.com/yongxinz/backend-interview) | 後端共通題：MySQL、Redis、訊息佇列、網路、作業系統、系統設計與架構 | `database`、`redis`、`backend-engineering`、`system-design`、`computer-network`、`message-queue` |

`kubernetes`、`ai-llm`、`ai-agent` 三類沒有對應的來源專案，題目來自官方文件與實務經驗。

各分類自己的 `README.md` 會再說明該類別的選題邏輯與難度分布。
