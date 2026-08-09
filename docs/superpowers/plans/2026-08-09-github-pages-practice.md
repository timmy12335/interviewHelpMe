# GitHub Pages Practice Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓前端建置時讀取 `content/` 題庫，提供分類瀏覽與練習模式（隱藏／顯示答案），並以靜態匯出部署到 GitHub Pages。

**Architecture:** Next.js 14 於建置期掃描 monorepo `content/**/*.md`，解析 frontmatter 與題目／答案後做 SSG；`output: 'export'` 部署 Pages。答案切換為 client component。`NEXT_PUBLIC_BASE_PATH` 支援子路徑。

**Tech Stack:** Next.js 14、React 18、TypeScript、Ant Design 5、gray-matter、Vitest、GitHub Actions

**Spec:** `docs/superpowers/specs/2026-08-09-github-pages-practice-design.md`

## Global Constraints

- 無後端、無 MySQL、無 docker-compose
- 題庫唯一來源：`content/`（略過 `README.md`）
- 沿用既有 `Question`／`Category` 與共用元件
- 缺 `# 題目` 或 `## 核心答案` → 建置失敗並印出路徑
- 預設分支：`master`
- 不做：登入、雲端收藏、全文搜尋、wiki 連結轉換

## File Structure

| Path | Responsibility |
|------|----------------|
| `frontend/src/lib/content/parseQuestionMarkdown.ts` | 字串 → `Question` |
| `frontend/src/lib/content/loadContent.ts` | 掃描 content、組列表 |
| `frontend/src/lib/content/categories.ts` | 分類中繼（對齊 schema.sql） |
| `frontend/src/lib/paths.ts` | `withBasePath()` |
| `frontend/src/components/PracticeQuestion/` | 答案顯示切換 |
| `frontend/src/components/SiteHeader/` | 站名 |
| `frontend/src/app/page.tsx` | 分類首頁 |
| `frontend/src/app/category/[slug]/page.tsx` | 分類列表 |
| `frontend/src/app/category/[slug]/question/[questionSlug]/page.tsx` | 題目詳情 |
| `frontend/next.config.mjs` | static export + basePath |
| `.github/workflows/pages.yml` | Pages 部署 |
| `README.md` | 使用說明 |

---

### Task 1: Markdown 題目解析器

**Files:**
- Modify: `frontend/package.json`、`frontend/vitest.config.ts`
- Create: `frontend/src/lib/content/parseQuestionMarkdown.ts`
- Create: `frontend/src/lib/content/parseQuestionMarkdown.test.ts`

**Interfaces:**
- Produces: `parseQuestionMarkdown(raw: string, filePathForErrors: string): Question`

- [ ] **Step 1: 安裝 gray-matter** — `cd frontend && npm install gray-matter`
- [ ] **Step 2: Vitest** — `include: ["src/**/*.{test,spec}.{ts,tsx}"]`
- [ ] **Step 3: 寫失敗測試** — frontmatter 映射；content／answer 切分；缺標題 throw 含檔名
- [ ] **Step 4: 跑測 FAIL** — `npm test -- src/lib/content/parseQuestionMarkdown.test.ts`
- [ ] **Step 5: 實作 parser** — gray-matter；驗證 id/category/slug/title/difficulty；以 `# 題目` 與 `## 核心答案` 切分；`category` → `categorySlug`
- [ ] **Step 6: 跑測 PASS**
- [ ] **Step 7: Commit** — `feat: parse interview markdown into Question model`

Parser 參考實作見下方程式碼區塊（實作時可直接採用）。

```ts
import matter from "gray-matter";
import type { Difficulty, Question } from "@/types/question";
const DIFFICULTIES = new Set<Difficulty>(["easy", "medium", "hard"]);
export function parseQuestionMarkdown(raw: string, filePathForErrors: string): Question {
  const { data, content: body } = matter(raw);
  const fm = data as Record<string, unknown>;
  for (const key of ["id", "category", "slug", "title", "difficulty"] as const) {
    if (!fm[key] || typeof fm[key] !== "string") {
      throw new Error(`${filePathForErrors}: missing or invalid frontmatter "${key}"`);
    }
  }
  if (!DIFFICULTIES.has(fm.difficulty as Difficulty)) {
    throw new Error(`${filePathForErrors}: invalid difficulty "${String(fm.difficulty)}"`);
  }
  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
  const questionHeading = /^# 題目\s*$/m;
  const answerHeading = /^## 核心答案\s*$/m;
  if (!questionHeading.test(body)) throw new Error(`${filePathForErrors}: missing "# 題目" heading`);
  if (!answerHeading.test(body)) throw new Error(`${filePathForErrors}: missing "## 核心答案" heading`);
  const answerMatch = body.match(answerHeading)!;
  const beforeAnswer = body.slice(0, answerMatch.index);
  const answer = body.slice(answerMatch.index!).trim();
  const questionMatch = beforeAnswer.match(questionHeading)!;
  const content = beforeAnswer.slice(questionMatch.index! + questionMatch[0].length).trim();
  if (!content) throw new Error(`${filePathForErrors}: empty question content`);
  return { id: fm.id as string, slug: fm.slug as string, title: fm.title as string,
    difficulty: fm.difficulty as Difficulty, tags, content, answer, categorySlug: fm.category as string };
}
```

---

### Task 2: Content loader 與分類中繼資料

**Files:** `frontend/src/lib/content/categories.ts`、`loadContent.ts`、`loadContent.test.ts`、`__fixtures__/sample-cat/001-sample.md`

**Interfaces:** `CATEGORY_META`、`getContentRoot()`、`getAllCategories()`、`getQuestionsByCategory`、`getQuestion`、`getAllQuestions`、以及 `*FromRoot` 測試變體

- [ ] **Step 1:** 11 類對齊 `backend/sql/schema.sql`（slug／nameZh／sortOrder）
- [ ] **Step 2:** fixture 最小合法 markdown
- [ ] **Step 3–4:** 測試 FAIL（1 類 1 題）
- [ ] **Step 5:** `getContentRoot()` = `path.resolve(process.cwd(), "..", "content")`；略過 README；category 必須等於目錄名
- [ ] **Step 6:** PASS
- [ ] **Step 7:** Commit `feat: load categories and questions from content directory`

---

### Task 3: 靜態匯出與 basePath

**Files:** `frontend/next.config.mjs`、`frontend/src/lib/paths.ts`、`paths.test.ts`

**Interfaces:** `withBasePath(path: string, basePath?: string): string`

- [ ] **Step 1:** 實作 `withBasePath`（空 base 原樣；有 base 去尾斜線後串接）+ 測試
- [ ] **Step 2:** `next.config.mjs`：`output: "export"`、`trailingSlash: true`、`images.unoptimized: true`、條件式 `basePath`／`assetPrefix` 來自 `NEXT_PUBLIC_BASE_PATH`
- [ ] **Step 3:** Commit `feat: enable static export and basePath helper for GitHub Pages`

規則：`next/link` 不要手動加 basePath；`CategoryNav`／`QuestionList` 的原生 `<a>` 必須用 `withBasePath`。

```ts
export function withBasePath(path: string, basePath: string = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  if (!path.startsWith("/")) return path;
  const base = basePath.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}
```

---

### Task 4: 站台殼層與分類首頁

**Files:** `SiteHeader/index.tsx`、`layout.tsx`、`page.tsx`、`globals.css`

- [ ] **Step 1:** SiteHeader — `Link href="/"` 顯示 InterviewHelpMe
- [ ] **Step 2:** layout 加入 SiteHeader；description「面試題練習站」
- [ ] **Step 3:** globals.css — main 寬 `min(960px, calc(100% - 48px))`
- [ ] **Step 4:** page — getAllCategories() + CategoryNav；getHref 使用 withBasePath("/category/${c.slug}/")
- [ ] **Step 5:** `npm run dev` — 首頁見 11 分類與題數
- [ ] **Step 6:** Commit `feat: add practice site shell and category home page`

---

### Task 5: 分類題目列表頁

**Files:** `frontend/src/app/category/[slug]/page.tsx`

- [ ] **Step 1:** `generateStaticParams` + QuestionList + CategoryNav；`withBasePath` 連題目頁；未知 slug → `notFound()`
- [ ] **Step 2:** 驗證 `/category/ai-agent/`
- [ ] **Step 3:** Commit `feat: add static category question list pages`

---

### Task 6: 題目詳情與練習模式

**Files:** `PracticeQuestion/index.tsx`、`PracticeQuestion.test.tsx`、`category/[slug]/question/[questionSlug]/page.tsx`

**Interfaces:** `PracticeQuestion({ question: Question })`

- [ ] **Step 1–2:** 測試 FAIL — 預設無「推薦答案」；點「顯示推薦答案」後出現
- [ ] **Step 3:** `useState(false)` + Button + `QuestionCard showAnswer={showAnswer}`
- [ ] **Step 4:** 測試 PASS
- [ ] **Step 5:** 詳情頁 — `generateStaticParams` 來自 `getAllQuestions()`；PracticeQuestion；Link 返回分類
- [ ] **Step 6:** E2E — 首頁 → 分類 → 題目 → 切換答案
- [ ] **Step 7:** Commit `feat: add practice question pages with answer toggle`

```tsx
"use client";
import { Button, Space } from "antd";
import { useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import type { Question } from "@/types/question";
export function PracticeQuestion({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Button onClick={() => setShowAnswer((v) => !v)}>
        {showAnswer ? "隱藏推薦答案" : "顯示推薦答案"}
      </Button>
      <QuestionCard question={question} showAnswer={showAnswer} />
    </Space>
  );
}
```

---

### Task 7: 建置、Actions、README

**Files:** `.github/workflows/pages.yml`、`README.md`

- [ ] **Step 1:** `cd frontend && npm run build` — 產出 `out/`
- [ ] **Step 2:** workflow — push `master`；`NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }}`；upload `frontend/out`；deploy-pages
- [ ] **Step 3:** README — 本地／Pages 說明（Settings → Pages → GitHub Actions）
- [ ] **Step 4:** `npm test` 全過
- [ ] **Step 5:** Commit `ci: deploy static practice site to GitHub Pages`

Workflow 要點：`actions/checkout@v4`、`setup-node@v4`（node 20）、`working-directory: frontend` 執行 `npm ci && npm run build`、`upload-pages-artifact@v3` path `frontend/out`、`deploy-pages@v4`。若為 user 根站則 `NEXT_PUBLIC_BASE_PATH` 設空字串。

---

## Spec coverage

| Spec | Task |
|------|------|
| 讀 content／缺標題失敗 | 1–2 |
| 路由與練習模式 | 4–6 |
| static export + basePath + Actions | 3、7 |
| 無後端 | 全域 |

## Type consistency

- Parser／loader → `Question`／`Category`
- `withBasePath` 僅給原生 `<a>`
- `PracticeQuestion` 只收 `question: Question`
