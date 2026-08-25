#!/usr/bin/env node
/**
 * 產生一題新題目的骨架。
 *
 * 補題的人不需要記住 frontmatter 有哪些欄位、七個區塊的順序、
 * 或是 id 要怎麼和檔名對齊——這些都有測試在驗，但與其等測試紅了再回頭修，
 * 不如一開始就給對的骨架。編號也由這裡決定，避免兩個人同時補題撞號。
 *
 *   node scripts/new-question.mjs <分類> <slug> "<標題>" [--difficulty=medium] [--tags=a,b]
 *
 * 例：
 *   node scripts/new-question.mjs kubernetes deployment-vs-statefulset \
 *     "Deployment 與 StatefulSet 的差異" --difficulty=medium --tags=Deployment,StatefulSet
 */

import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveContentPath } from "./gen-scripts.mjs";

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

/** 只允許小寫英數與連字號：slug 會直接變成網址的一段。 */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseArgs(argv) {
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const flags = new Map(
    argv
      .filter((arg) => arg.startsWith("--"))
      .map((arg) => {
        const [key, ...rest] = arg.replace(/^--/, "").split("=");
        return [key, rest.join("=")];
      }),
  );

  const [category, slug, title] = positional;
  return {
    category,
    slug,
    title,
    difficulty: flags.get("difficulty") ?? "medium",
    tags: (flags.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
  };
}

/** 該分類已有的題目檔名（不含 README）。 */
async function listQuestionFiles(categoryDir) {
  const entries = await readdir(categoryDir);
  return entries.filter((name) => /^\d+-.*\.md$/.test(name));
}

/** 掃過該分類已有的檔案，回傳下一個三位數編號。 */
function nextNumber(files) {
  const numbers = files.map((name) => Number(name.slice(0, name.indexOf("-"))));
  const next = numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  return String(next).padStart(3, "0");
}

/** 檔名 `017-consistent-hashing.md` 推出的 slug。 */
function fileSlug(fileName) {
  return fileName.replace(/\.md$/, "").replace(/^\d+-/, "");
}

/**
 * 骨架刻意留下 TODO，而不是產出看起來已完成的空殼。
 * 半成品被誤當成完成品，比明顯的未完成更難發現。
 */
function skeleton({ id, category, slug, title, difficulty, tags }) {
  const tagList = tags.length > 0 ? tags.join(", ") : "TODO";

  return `---
id: ${id}
category: ${category}
slug: ${slug}
title: ${title}
difficulty: ${difficulty}
tags: [${tagList}]
source: original
---

# 題目

TODO：用一句話問出這題真正要考的東西。

## 核心答案

TODO：先給結論，再展開。這一段要能單獨回答整題。

## 詳細解析

**TODO 小標**：TODO 內文。每一段用 \`**小標**：\` 開頭，站上會把小標攤成
可掃描的目錄、內文預設收起。

## 面試回答方式

TODO：講答題策略——先講什麼、再補什麼、哪裡是加分點。這是提示，不是逐字稿。

## 講稿

TODO：可以照著念的逐字稿，第一人稱、口語但專業。

目標 270-400 字（約 60-90 秒），3-5 段，一段一口氣。開頭要有自己的切入方式，
不要用「我的理解是，」這種模板起手式。單句不要超過 50 字。

## 常見追問

### TODO：追問一

**核心答案**：TODO

**詳細解析**：TODO

**面試回答方式**：TODO

### TODO：追問二

**核心答案**：TODO

**詳細解析**：TODO

**面試回答方式**：TODO

### TODO：追問三

**核心答案**：TODO

**詳細解析**：TODO

**面試回答方式**：TODO

## 相關

- [[TODO-同分類的相關題目.md]]
`;
}

async function main() {
  const { category, slug, title, difficulty, tags } = parseArgs(process.argv.slice(2));

  if (!category || !slug || !title) {
    throw new Error(
      '用法：new-question.mjs <分類> <slug> "<標題>" [--difficulty=medium] [--tags=a,b]',
    );
  }
  if (!SLUG_RE.test(slug)) {
    throw new Error(`slug 只能用小寫英數與連字號：${slug}`);
  }
  if (!DIFFICULTIES.has(difficulty)) {
    throw new Error(`difficulty 只能是 easy / medium / hard：${difficulty}`);
  }

  const categoryDir = resolveContentPath(category);
  const existing = await listQuestionFiles(categoryDir);

  // slug 就是網址的一段，同分類重複會讓兩題指向同一個頁面。
  // 只比對目標檔名不夠——編號不同但 slug 相同一樣會撞。
  const clash = existing.find((name) => fileSlug(name) === slug);
  if (clash) {
    throw new Error(`${category} 已經有 slug 為 "${slug}" 的題目：${clash}`);
  }

  const number = nextNumber(existing);
  const fileName = `${number}-${slug}.md`;
  const full = path.join(categoryDir, fileName);

  await writeFile(
    full,
    skeleton({ id: `${category}-${number}`, category, slug, title, difficulty, tags }),
    "utf8",
  );

  console.log(`已建立 ${category}/${fileName}`);
  console.log("接著：把檔案裡的 TODO 換成內容，然後跑");
  console.log("  cd frontend && npm test        # 驗證結構與交叉連結");
  console.log(`  node scripts/check-scripts.mjs ${category}   # 驗證講稿文字品質`);
  console.log(`別忘了更新 content/${category}/README.md 的題數，測試會檢查。`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`錯誤：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
