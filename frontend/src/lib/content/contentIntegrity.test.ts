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

/**
 * 程式碼區塊與行內程式碼換成等長的空白，讓後面數 `**` 時不會把
 * `securityMatcher("/api/**")` 這種 Ant 路徑當成粗體標記。
 */
function maskCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```|`[^`\n]*`/g, (code) =>
    code.replace(/[^\n]/g, " "),
  );
}

function countCjk(text: string): number {
  return text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
}

/** 粗體片段超過這個 CJK 字數，標的就是整個子句而不是術語。 */
const MAX_BOLD_CJK = 12;

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

  it("同一分類裡沒有重複的 slug", () => {
    // slug 就是網址的一段。同分類撞 slug 會讓兩題指向同一個頁面，
    // 而編號不同時光看檔名列表看不出來。
    const duplicates = CATEGORIES.flatMap((category) => {
      const seen = new Map<string, string>();
      return QUESTIONS.filter((q) => q.category === category).flatMap((question) => {
        const slug = expectedSlug(question.fileName);
        const first = seen.get(slug);
        seen.set(slug, question.fileName);
        return first ? [`${category} 的 ${first} 與 ${question.fileName} slug 都是 ${slug}`] : [];
      });
    });

    expect(duplicates).toEqual([]);
  });

  it("id 在全站唯一", () => {
    const seen = new Map<string, string>();
    const duplicates = QUESTIONS.flatMap((question) => {
      const id = frontmatterValue(question.markdown, "id") ?? "";
      const first = seen.get(id);
      seen.set(id, question.label);
      return first ? [`${first} 與 ${question.label} 的 id 都是 ${id}`] : [];
    });

    expect(duplicates).toEqual([]);
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

  it("粗體標記都成對", () => {
    // 落單的 `**` 會原封不動印在頁面上。撰寫當下有 18 行是這個狀況，
    // 多半是整句粗體改寫到一半留下的。
    const unpaired = QUESTIONS.flatMap((question) =>
      maskCode(question.markdown)
        .split("\n")
        .flatMap((line, index) =>
          (line.match(/\*\*/g)?.length ?? 0) % 2 === 1
            ? [`${question.label}:${index + 1} 有落單的 **`]
            : [],
        ),
    );

    expect(unpaired).toEqual([]);
  });

  it("粗體只標術語與短片語，不標整個子句", () => {
    // 這是會整批漂移的東西：一批一批寫下來，粗體從「標術語」變成「標整句」，
    // 而每一篇單獨看都不覺得奇怪。曾經漂到全篇 75% 的字都是粗體，
    // 那時粗體已經不帶任何訊息。
    const tooLong = QUESTIONS.flatMap((question) =>
      [...maskCode(question.markdown).matchAll(/\*\*([^\n*][^\n]*?)\*\*/g)]
        .filter((match) => countCjk(match[1]) > MAX_BOLD_CJK)
        .map(
          (match) =>
            `${question.label} 有 ${countCjk(match[1])} 字的粗體：${match[1].slice(0, 20)}…`,
        ),
    );

    expect(tooLong).toEqual([]);
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

  it("每一題都至少被另一題連到", () => {
    // 「相關」是照著撰寫順序長出來的：寫新題時指向已經存在的舊題，於是
    // 每個分類的後半段只有出向連結、沒有反向連結。曾經有 153 題（17%）
    // 只能從分類列表進去，順著「相關」走永遠走不到。
    const linked = new Set<string>();
    for (const question of QUESTIONS) {
      for (const match of question.markdown.matchAll(/\[\[([^\]\[]+)\]\]/g)) {
        const target = parseWikiTarget(match[1].trim(), question.category);
        if (target) {
          linked.add(`${target.categorySlug}/${target.slug}`);
        }
      }
    }

    const unreachable = QUESTIONS.filter(
      (question) => !linked.has(`${question.category}/${expectedSlug(question.fileName)}`),
    ).map((question) => `${question.label} 沒有任何題目連過來`);

    expect(unreachable).toEqual([]);
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

  it("每個註冊的分類都有題目", () => {
    // 註冊了分類卻忘了補內容，站上會出現一個點進去空無一物的頁面。
    const empty = CATEGORIES.filter(
      (category) => !QUESTIONS.some((question) => question.category === category),
    );

    expect(empty).toEqual([]);
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
