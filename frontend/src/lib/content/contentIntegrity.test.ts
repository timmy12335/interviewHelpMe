/**
 * 題庫的結構驗證。
 *
 * 這些檢查刻意寫成測試，而不是一支獨立的 CLI 腳本再接一個 CI step。
 * 獨立的檢查會腐爛——沒有人會記得跑，新增的 CI step 也可能被移掉或跳過。
 * 寫在測試裡，它就跟著 `npm test` 一起跑：本機跑測試會擋、CI 的 Test 階段
 * 會擋（而且排在 Build 之前），要繞過它得刪掉測試檔，那是 code review
 * 攔得下來的動作。
 *
 * 這些不是憑空想像的風險。撰寫當下，題庫裡就有 5 個指向 README 的
 * wiki 連結解析不到，使用者在已上線的頁面上看得到 `[[../redis/README.md]]`
 * 這串原始語法；而分類 README 的總題數也已經過期過兩次。
 */

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CATEGORY_META } from "./categories";
import { getContentRoot } from "./loadContent";
import { parseWikiTarget } from "./wikiLinks";

const CONTENT_ROOT = getContentRoot();
const SCHEMA_SQL = path.resolve(CONTENT_ROOT, "..", "backend", "sql", "schema.sql");

/** 每一題都必須具備的區塊。少了任何一個，頁面上就會有一塊是空的。 */
const REQUIRED_SECTIONS = [
  "# 題目",
  "## 核心答案",
  "## 詳細解析",
  "## 面試回答方式",
  "## 講稿",
  "## 常見追問",
  "## 相關",
] as const;

type QuestionFile = {
  category: string;
  fileName: string;
  /** `java/001-x.md`，測試失敗訊息用這個定位。 */
  label: string;
  markdown: string;
  /** 檔名裡的三位數編號。 */
  number: number;
};

function listCategories(): string[] {
  return fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listQuestionFiles(category: string): QuestionFile[] {
  return fs
    .readdirSync(path.join(CONTENT_ROOT, category))
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .sort()
    .map((fileName) => ({
      category,
      fileName,
      label: `${category}/${fileName}`,
      markdown: fs.readFileSync(path.join(CONTENT_ROOT, category, fileName), "utf8"),
      number: Number(fileName.match(/^(\d+)-/)?.[1] ?? NaN),
    }));
}

const CATEGORIES = listCategories();
const QUESTIONS = CATEGORIES.flatMap(listQuestionFiles);

function frontmatterValue(markdown: string, key: string): string | undefined {
  return markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim();
}

/** 檔名 `017-consistent-hashing.md` 推出的 slug。 */
function expectedSlug(fileName: string): string {
  return fileName.replace(/\.md$/, "").replace(/^\d+-/, "");
}

describe("題庫結構", () => {
  it("有題目可以檢查", () => {
    expect(QUESTIONS.length).toBeGreaterThan(0);
  });

  it("每一題都具備所有必要區塊", () => {
    const missing = QUESTIONS.flatMap((question) =>
      REQUIRED_SECTIONS.filter(
        (section) => !new RegExp(`^${section}[ \\t]*$`, "m").test(question.markdown),
      ).map((section) => `${question.label} 缺少「${section}」`),
    );

    expect(missing).toEqual([]);
  });

  it("frontmatter 的 id、slug、category 與檔案位置一致", () => {
    const mismatched = QUESTIONS.flatMap((question) => {
      const problems: string[] = [];
      const number = String(question.number).padStart(3, "0");

      if (frontmatterValue(question.markdown, "id") !== `${question.category}-${number}`) {
        problems.push(`${question.label} 的 id 應為 ${question.category}-${number}`);
      }
      if (frontmatterValue(question.markdown, "slug") !== expectedSlug(question.fileName)) {
        problems.push(`${question.label} 的 slug 應為 ${expectedSlug(question.fileName)}`);
      }
      if (frontmatterValue(question.markdown, "category") !== question.category) {
        problems.push(`${question.label} 的 category 應為 ${question.category}`);
      }

      return problems;
    });

    expect(mismatched).toEqual([]);
  });

  it("每個分類的檔案編號從 001 開始連續", () => {
    const gaps = CATEGORIES.flatMap((category) => {
      const numbers = QUESTIONS.filter((q) => q.category === category).map((q) => q.number);
      return numbers
        .map((number, index) =>
          number === index + 1
            ? null
            : `${category} 的第 ${index + 1} 個檔案編號是 ${number}`,
        )
        .filter((problem): problem is string => problem !== null);
    });

    expect(gaps).toEqual([]);
  });
});

describe("題目之間的交叉連結", () => {
  /** `category/slug` 的集合；wiki 連結必須指得到其中一個。 */
  const index = new Set(
    QUESTIONS.map((q) => `${q.category}/${expectedSlug(q.fileName)}`),
  );

  it("所有 [[...]] 都指得到實際存在的題目", () => {
    const broken = QUESTIONS.flatMap((question) =>
      [...question.markdown.matchAll(/\[\[([^\]\[]+)\]\]/g)]
        .map((match) => match[1].trim())
        .filter((raw) => {
          const target = parseWikiTarget(raw, question.category);
          return !target || !index.has(`${target.categorySlug}/${target.slug}`);
        })
        .map((raw) => `${question.label} 指向不存在的 [[${raw}]]`),
    );

    // 解析不到的連結不會消失，會原封不動印在頁面上讓使用者看到 `[[...]]`。
    expect([...new Set(broken)]).toEqual([]);
  });
});

describe("分類註冊", () => {
  it("CATEGORY_META 與 content/ 底下的目錄一一對應", () => {
    expect([...CATEGORY_META].map(({ slug }) => slug).sort()).toEqual(CATEGORIES);
  });

  it("CATEGORY_META 與 schema.sql 的分類清單一致", () => {
    const sql = fs.readFileSync(SCHEMA_SQL, "utf8");
    const inSql = [...sql.matchAll(/\(\s*'([a-z-]+)',\s*'[^']*',\s*'[^']*',\s*\d+\s*\)/g)]
      .map((match) => match[1])
      .sort();

    // 兩邊都要手動維護，漏掉一邊在建置階段不會有人發現。
    expect(inSql).toEqual([...CATEGORY_META].map(({ slug }) => slug).sort());
  });

  it("sortOrder 不重複且連續", () => {
    const orders = [...CATEGORY_META].map(({ sortOrder }) => sortOrder).sort((a, b) => a - b);

    expect(orders).toEqual(orders.map((_, index) => index + 1));
  });
});

describe("README 的題數", () => {
  it("每個分類 README 宣稱的題數與實際檔案數一致", () => {
    const wrong = CATEGORIES.flatMap((category) => {
      const readme = path.join(CONTENT_ROOT, category, "README.md");
      if (!fs.existsSync(readme)) {
        return [];
      }

      const claimed = fs.readFileSync(readme, "utf8").match(/共 (\d+) 題/)?.[1];
      const actual = QUESTIONS.filter((q) => q.category === category).length;

      return claimed !== undefined && Number(claimed) !== actual
        ? [`${category}/README.md 宣稱 ${claimed} 題，實際 ${actual} 題`]
        : [];
    });

    expect(wrong).toEqual([]);
  });

  it("README 宣稱的全站總題數與實際一致", () => {
    // 「共 264 題面試題」這種跨分類的總數過期過兩次，因為它沒有任何東西盯著。
    const wrong = CATEGORIES.flatMap((category) => {
      const readme = path.join(CONTENT_ROOT, category, "README.md");
      if (!fs.existsSync(readme)) {
        return [];
      }

      const claimed = fs.readFileSync(readme, "utf8").match(/共 (\d+) 題面試題/)?.[1];

      return claimed !== undefined && Number(claimed) !== QUESTIONS.length
        ? [`${category}/README.md 宣稱全站 ${claimed} 題，實際 ${QUESTIONS.length} 題`]
        : [];
    });

    expect(wrong).toEqual([]);
  });
});
