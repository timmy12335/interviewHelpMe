#!/usr/bin/env node
/**
 * 講稿的品質檢查。
 *
 * 潤飾是分批、由不同工作階段進行的，最大的風險不是單篇寫壞，而是
 * 整批漂移——開頭又變回同一個套路、Markdown 殘留沒清乾淨、字數失控。
 * 這支工具把那些「用眼睛看不出來、但一整批一起看就很明顯」的問題抓出來。
 *
 *   node scripts/check-scripts.mjs [category]
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readScriptSection, resolveContentPath } from "./gen-scripts.mjs";

const CONTENT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
);

/** 口說長度的合理區間（純字元數，約 60–90 秒）。 */
const MIN_CHARS = 250;
const MAX_CHARS = 460;

/** 同一個開頭出現超過這個次數，就是模板痕跡而不是巧合。 */
const OPENER_REPEAT_LIMIT = 3;
const OPENER_SAMPLE = 8;

const RULES = [
  {
    id: "機械開頭",
    test: (s) => s.startsWith("我的理解是"),
    hint: "生成器的固定套路，要換掉",
  },
  {
    id: "Markdown 殘留",
    test: (s) => /\*\*|^#{1,6}\s|\[\[|^\s*[-*+]\s/m.test(s),
    hint: "粗體、標題、wiki 連結或條列符號",
  },
  {
    id: "出處註記",
    test: (s) => /[（(]\s*(?:見|參見)/.test(s),
    hint: "「（見 …）」念出來會斷掉節奏",
  },
  {
    id: "半形標點",
    test: (s) => /[a-zA-Z0-9一-鿿][;]/.test(s),
    hint: "半形分號不該拿來當中文頓句",
  },
  {
    id: "收尾語",
    test: (s) => /(以上|謝謝|希望對你有幫助|以上就是)[。！]?\s*$/.test(s),
    hint: "講完最後一個重點就該停",
  },
];

function charCount(script) {
  return script.replace(/\s+/g, "").length;
}

/**
 * 最長的一段「沒有停頓的連續文字」。
 *
 * 量整句的長度是錯的判準：一句 63 字但每 13 字就有一個逗號，唸起來很順；
 * 一句 40 字卻一個標點都沒有，才是真的會斷氣。決定能不能唸的是換氣點的
 * 間隔，不是句子的總長。所以這裡切在所有停頓標記上，而不是只切句號。
 *
 * 只算中日韓字元——中英混排會讓字元數虛胖，英文唸起來比中文快得多。
 */
const PAUSE_RE = /[。！？；，、：\n]/;

function longestRun(script) {
  return script
    .split(PAUSE_RE)
    .reduce((max, s) => Math.max(max, (s.match(/[一-鿿]/g) ?? []).length), 0);
}

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collect(full)));
    } else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
      files.push(full);
    }
  }

  return files.sort();
}

async function main() {
  const category = process.argv[2];
  const root = resolveContentPath(category);

  const problems = [];
  const openers = new Map();
  const lengths = [];
  let missing = 0;

  for (const file of await collect(root)) {
    const relative = path.relative(CONTENT_DIR, file);
    const script = readScriptSection(await readFile(file, "utf8"));

    if (!script) {
      problems.push([relative, "沒有講稿", ""]);
      missing += 1;
      continue;
    }

    const chars = charCount(script);
    lengths.push(chars);

    for (const rule of RULES) {
      if (rule.test(script)) {
        problems.push([relative, rule.id, rule.hint]);
      }
    }

    if (chars < MIN_CHARS || chars > MAX_CHARS) {
      problems.push([relative, `字數 ${chars}`, `合理區間 ${MIN_CHARS}–${MAX_CHARS}`]);
    }

    const longest = longestRun(script);
    if (longest > 30) {
      problems.push([relative, `連續 ${longest} 字無停頓`, "唸到這裡會斷氣，補標點或拆句"]);
    }

    const opener = script.slice(0, OPENER_SAMPLE);
    openers.set(opener, [...(openers.get(opener) ?? []), relative]);
  }

  for (const [opener, files] of openers) {
    if (files.length > OPENER_REPEAT_LIMIT) {
      problems.push([
        `${files.length} 篇`,
        `開頭重複「${opener}」`,
        files.slice(0, 3).join("、") + "…",
      ]);
    }
  }

  const sorted = [...lengths].sort((a, b) => a - b);
  console.log(
    `檢查 ${lengths.length + missing} 篇` +
      (lengths.length
        ? `｜字數 中位 ${sorted[Math.floor(sorted.length / 2)]}、最短 ${sorted[0]}、最長 ${sorted[sorted.length - 1]}`
        : ""),
  );

  if (problems.length === 0) {
    console.log("沒有發現問題。");
    return;
  }

  console.log(`\n${problems.length} 個問題：`);
  for (const [where, what, hint] of problems) {
    console.log(`  ${where}  ${what}${hint ? `  — ${hint}` : ""}`);
  }
  process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(`錯誤：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
