#!/usr/bin/env node
/**
 * 潤飾講稿用的讀寫介面。
 *
 * 存在的理由是安全：潤飾是多個工作階段分批進行的，每次都讓人（或 agent）
 * 自己去 sed 一個 Markdown 檔，遲早會把區塊邊界改壞。這支工具只碰
 * `## 講稿` 這一段，其餘內容原封不動。
 *
 *   node scripts/polish-io.mjs read  <category/file.md>   # 印出改寫所需的素材
 *   node scripts/polish-io.mjs write <category/file.md>   # 從 stdin 讀新講稿寫回
 *   node scripts/polish-io.mjs list  [category]           # 列出所有題目檔
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readScriptSection, replaceScriptSection } from "./gen-scripts.mjs";

const CONTENT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
);

/** 改寫講稿需要的素材。刻意不含「常見追問」——那是檔案裡最大一塊，且與講稿無關。 */
const MATERIAL_HEADINGS = ["核心答案", "詳細解析", "面試回答方式"];

function sectionBody(markdown, heading) {
  const match = markdown.match(
    new RegExp(`^## ${heading}[ \\t]*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m"),
  );
  return match ? match[1].trim() : null;
}

function questionBody(markdown) {
  const match = markdown.match(/^# 題目[ \t]*$([\s\S]*?)(?=^## )/m);
  return match ? match[1].trim() : null;
}

function resolve(relative) {
  const full = path.resolve(CONTENT_DIR, relative);
  if (!full.startsWith(CONTENT_DIR + path.sep)) {
    throw new Error(`路徑超出 content/：${relative}`);
  }
  return full;
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

async function readCommand(relative) {
  const markdown = await readFile(resolve(relative), "utf8");

  console.log(`# 題目\n\n${questionBody(markdown) ?? "(無)"}`);
  for (const heading of MATERIAL_HEADINGS) {
    console.log(`\n## ${heading}\n\n${sectionBody(markdown, heading) ?? "(無)"}`);
  }

  const script = readScriptSection(markdown);
  console.log(`\n## 現有講稿（${script ? script.length : 0} 字）\n\n${script ?? "(無)"}`);
}

async function writeCommand(relative) {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const script = Buffer.concat(chunks).toString("utf8").trim();

  if (!script) {
    throw new Error("stdin 沒有內容，拒絕寫入空講稿");
  }
  if (/^#{1,6}\s/m.test(script)) {
    throw new Error("講稿不該包含 Markdown 標題，這會把區塊結構打亂");
  }

  const full = resolve(relative);
  const markdown = await readFile(full, "utf8");

  if (readScriptSection(markdown) === null) {
    throw new Error(`${relative} 沒有「## 講稿」區塊`);
  }

  await writeFile(full, replaceScriptSection(markdown, script), "utf8");
  console.log(`${relative}: 已寫入 ${script.length} 字`);
}

async function listCommand(category) {
  const root = category ? path.join(CONTENT_DIR, category) : CONTENT_DIR;
  for (const file of await collect(root)) {
    console.log(path.relative(CONTENT_DIR, file));
  }
}

async function main() {
  const [command, target] = process.argv.slice(2);

  if (command === "read" && target) {
    return readCommand(target);
  }
  if (command === "write" && target) {
    return writeCommand(target);
  }
  if (command === "list") {
    return listCommand(target);
  }

  console.error("用法：polish-io.mjs read|write <category/file.md> | list [category]");
  process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  // 這支工具主要給批次潤飾的工作階段使用，堆疊追蹤只會蓋住真正的原因。
  console.error(`錯誤：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
