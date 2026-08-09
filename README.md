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
