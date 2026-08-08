# Shared Components + Storybook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `frontend/` 建立 InterviewHelpMe 第一波共用元件（Ant Design）與 Storybook 8 Autodocs 互動說明。

**Architecture:** Next.js 14 App Router 內的 `src/components/` 純展示元件；資料型別對齊 `backend/sql/schema.sql`；導航以 `href`／`getHref` 注入；Storybook 用 `@storybook/nextjs` + Ant Design `ConfigProvider` decorator，fixtures 驅動所有演示。

**Tech Stack:** Next.js 14、React 18、TypeScript、Ant Design 5、bytemd、Storybook 8、Vitest、React Testing Library

**Spec:** `docs/superpowers/specs/2026-08-08-shared-components-storybook-design.md`

## Global Constraints

- UI 庫：Ant Design 5（不用 PrimeReact）
- 元件只吃純資料 props；禁止簽到 hook、禁止 mount 時打 API
- 說明文字：繁體中文 JSDoc；識別名維持英文
- 不複製 `reference/mianshiya-next` 原始碼或題目內容
- 第一波不做：收藏、簽到、MdEditor、QuestionTable、完整練習頁
- Storybook：CSF3 + `tags: ['autodocs']`；腳本 `storybook`／`build-storybook`

## File Structure

| Path | Responsibility |
|------|----------------|
| `frontend/package.json` | 依賴與 scripts |
| `frontend/src/types/question.ts` | `Difficulty`／`Question`／`Category` |
| `frontend/src/components/_fixtures/*` | Story／測試假資料 |
| `frontend/.storybook/*` | Storybook 設定與 Ant Design decorator |
| `frontend/src/components/{TagList,DifficultyBadge,EmptyState,LoadingState,MdViewer,CategoryNav,QuestionList,QuestionCard}/` | 元件 + stories + tests |
| `frontend/vitest.config.ts` | 單元測試設定 |


---

### Task 1: Scaffold frontend + types + fixtures

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.mjs`, `frontend/next-env.d.ts`
- Create: `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/globals.css`
- Create: `frontend/src/types/question.ts`
- Create: `frontend/src/components/_fixtures/questions.ts`, `frontend/src/components/_fixtures/categories.ts`
- Create: `frontend/vitest.config.ts`, `frontend/src/test/setup.ts`

**Interfaces:**
- Produces: `Difficulty`, `Question`, `Category`, `sampleQuestions`, `sampleCategories`, `sampleQuestion`, `manyTagsQuestion`

- [ ] **Step 1: 建立 `frontend/package.json`**

包含 scripts：`dev`／`build`／`start`／`lint`／`test`（vitest run）／`test:watch`／`storybook`／`build-storybook`。

dependencies：`next@14.2.7`、`react@^18.3.1`、`react-dom@^18.3.1`、`antd@^5.20.3`、`@ant-design/nextjs-registry@^1.0.1`、`@ant-design/cssinjs@^1.21.1`、`@bytemd/react@^1.21.0`、`@bytemd/plugin-gfm@^1.21.0`、`@bytemd/plugin-highlight@^1.21.0`、`bytemd@^1.21.0`、`github-markdown-css@^5.6.1`。

devDependencies：`storybook@^8.2.9`、`@storybook/nextjs@^8.2.9`、`@storybook/react@^8.2.9`、`@storybook/addon-essentials@^8.2.9`、`@storybook/addon-interactions@^8.2.9`、`@storybook/addon-links@^8.2.9`、`@storybook/blocks@^8.2.9`、`@storybook/test@^8.2.9`、`vitest@^2.0.5`、`@vitejs/plugin-react@^4.3.1`、`jsdom@^25.0.0`、`@testing-library/react@^16.0.1`、`@testing-library/jest-dom@^6.5.0`、`@testing-library/user-event@^14.5.2`、`typescript@^5.5.4`、`@types/node`／`@types/react`／`@types/react-dom`。

- [ ] **Step 2: 建立 TypeScript／Next 設定**

`tsconfig.json`：`strict`、`jsx: preserve`、`paths: { "@/*": ["./src/*"] }`。

`next.config.mjs`：`reactStrictMode: true`。

- [ ] **Step 3: 建立 stub App**

`layout.tsx`：`AntdRegistry` + `ConfigProvider locale={zhTW}`，`lang="zh-Hant"`。

`page.tsx`：標題 InterviewHelpMe，提示執行 `npm run storybook`。

- [ ] **Step 4: 建立型別 `src/types/question.ts`**

```ts
export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  content: string;
  answer?: string;
  categorySlug: string;
};

export type Category = {
  slug: string;
  nameZh: string;
  description?: string;
  questionCount?: number;
};
```

- [ ] **Step 5: 建立 fixtures**

`_fixtures/questions.ts`：`sampleQuestion`、`sampleQuestions`（≥3）、`manyTagsQuestion`（≥8 tags）。

`_fixtures/categories.ts`：`sampleCategories`（含 java、java-concurrency、redis、system-design）。

- [ ] **Step 6: Vitest 設定**

`vitest.config.ts`：jsdom、setupFiles、`include: src/**/*.test.tsx`、alias `@`、bytemd 相關 `server.deps.inline`。

`src/test/setup.ts`：`import "@testing-library/jest-dom/vitest"`。

- [ ] **Step 7: 安裝並型別檢查**

```bash
cd frontend && npm install && npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 8: Commit** `chore: scaffold frontend with types and fixtures`

---

### Task 2: Storybook 設定

**Files:**
- Create: `frontend/.storybook/main.ts`
- Create: `frontend/.storybook/preview.tsx`
- Create: `frontend/public/.gitkeep`

**Interfaces:**
- Produces: Storybook 啟動後所有 stories 包在 `ConfigProvider(zh_TW)` 內

- [ ] **Step 1: `.storybook/main.ts`** — stories `../src/**/*.stories.@(ts|tsx)`；addons essentials/interactions/links；framework `@storybook/nextjs`；alias `@`；`docs.autodocs: "tag"`
- [ ] **Step 2: `.storybook/preview.tsx`** — ConfigProvider `zh_TW`；引入 antd reset、github-markdown-css、bytemd、highlight.js vs.css
- [ ] **Step 3: `mkdir -p frontend/public && touch frontend/public/.gitkeep`**
- [ ] **Step 4: Commit** `chore: add Storybook 8 with Ant Design preview`


### Task 3: TagList

**Files:** `frontend/src/components/TagList/{index.tsx,TagList.stories.tsx,TagList.test.tsx}`

**Produces:** `TagList({ tags: string[]; max?: number })` — 空 → `null`；超出 max → `+N`

- [ ] **Step 1: 失敗測試** — empty / under max / truncate +N
- [ ] **Step 2: `npm test -- src/components/TagList/TagList.test.tsx` → FAIL
- [ ] **Step 3: 實作 TagList（antd Tag）**
- [ ] **Step 4: 測試 PASS**
- [ ] **Step 5: Stories** Default／Empty／ManyTags（`tags: ['autodocs']`）
- [ ] **Step 6: `npm run storybook` 抽查**
- [ ] **Step 7: Commit** `feat: add TagList component with stories and tests`

---

### Task 4: DifficultyBadge

**Files:** `frontend/src/components/DifficultyBadge/{index.tsx,DifficultyBadge.stories.tsx,DifficultyBadge.test.tsx}`

**Produces:** `DifficultyBadge({ difficulty })` — 簡單／中等／困難；color success／warning／error

- [ ] **Step 1–4: TDD（三難度文案）+ Stories（Default／Easy／Hard + select control）**
- [ ] **Step 5: Commit** `feat: add DifficultyBadge with Storybook controls`

---

### Task 5: EmptyState + LoadingState

**Files:**
- `frontend/src/components/EmptyState/{index.tsx,EmptyState.stories.tsx,EmptyState.test.tsx}`
- `frontend/src/components/LoadingState/{index.tsx,LoadingState.stories.tsx,LoadingState.test.tsx}`

**Produces:**
- `EmptyState({ title; description?; action? })`
- `LoadingState({ tip?; fullscreen? })`

- [ ] **Step 1: EmptyState TDD + Stories（Default／WithAction）**
- [ ] **Step 2: LoadingState TDD + Stories（Default／Fullscreen）**
- [ ] **Step 3: Commit** `feat: add EmptyState and LoadingState shared components`

---

### Task 6: MdViewer

**Files:** `frontend/src/components/MdViewer/{index.tsx,MdViewer.stories.tsx,MdViewer.test.tsx}`

**Produces:** `MdViewer({ value?: string })` — bytemd Viewer + gfm + highlight；`"use client"`

- [ ] **Step 1–3: TDD（渲染 heading 文字）+ Stories（Default／Empty／LongContent）**
- [ ] **Step 4: Commit** `feat: add MdViewer with GFM and highlight support`

---

### Task 7: CategoryNav

**Files:** `frontend/src/components/CategoryNav/{index.tsx,CategoryNav.stories.tsx,CategoryNav.test.tsx}`

**Produces:** `CategoryNav({ categories; activeSlug?; getHref?; onNavigate? })` — active 設 `aria-current="page"`；有 onNavigate 時 preventDefault

- [ ] **Step 1–3: TDD（active + onNavigate）+ Stories（Default／Empty，`onNavigate: fn()`）**
- [ ] **Step 4: Commit** `feat: add CategoryNav with injectable navigation`

---

### Task 8: QuestionList

**Files:** `frontend/src/components/QuestionList/{index.tsx,QuestionList.stories.tsx,QuestionList.test.tsx}`

**Produces:** `QuestionList({ questions; title?; emptyText?; getHref? })` — 組合 DifficultyBadge／TagList／EmptyState

- [ ] **Step 1–3: TDD（titles／empty）+ Stories（Default／Empty／ManyTags）**
- [ ] **Step 4: Commit** `feat: add QuestionList composing badge tags and empty state`

---

### Task 9: QuestionCard

**Files:** `frontend/src/components/QuestionCard/{index.tsx,QuestionCard.stories.tsx,QuestionCard.test.tsx}`

**Produces:** `QuestionCard({ question; showAnswer?; href? })` — 預設 showAnswer true；PracticeMode 隱藏「推薦答案」；禁止 side effect

- [ ] **Step 1–3: TDD（隱藏／顯示答案）+ Stories（Default／WithAnswer／PracticeMode／LongContent）**
- [ ] **Step 4: Commit** `feat: add QuestionCard with practice mode hide-answer`

---

### Task 10: 驗收

**Files:** Create `frontend/.gitignore`（node_modules、.next、storybook-static、out、*.log）

- [ ] **Step 1: `cd frontend && npm test` → 全 PASS**
- [ ] **Step 2: `npm run build-storybook` → 產出 storybook-static**
- [ ] **Step 3: 核對八元件 Autodocs／Controls／Actions 覆蓋 spec**
- [ ] **Step 4: Commit** `chore: ignore Storybook static output and verify build`

---

## Spec Coverage Self-Review

| Spec 要求 | Task |
|-----------|------|
| frontend scaffold + Ant Design | 1 |
| types／fixtures 對齊 schema | 1 |
| Storybook + zh_TW + markdown CSS | 2 |
| TagList／DifficultyBadge／Empty／Loading／MdViewer／CategoryNav／QuestionList／QuestionCard | 3–9 |
| build-storybook | 10 |
| 不做收藏／簽到／MdEditor／Table | 未列入 |

**Type consistency:** 一律 `tags: string[]`（非 `tagList`）；型別來自 `@/types/question`。
