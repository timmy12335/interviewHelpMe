#!/usr/bin/env node
/**
 * 從「面試回答方式」產生可逐字念的「講稿」區塊。
 *
 * 依據：內容裡的 `「」` 標的正是面試當下要講出口的那句話
 * （見 frontend/src/lib/content/emphasizeQuotes.ts；273 題裡有 264 題適用）。
 * 這支腳本把散落在引號裡的句子抽出來，補上口語銜接詞，串成一段講稿。
 *
 * 產出是「骨架」不是「成品」：語意正確、可以念，但語氣仍待逐篇潤飾。
 *
 *   node scripts/gen-scripts.mjs [--dry-run] [--force] [--fix-short] [--only=<分類>]
 *
 * --fix-short 只重寫「已存在但短到不成一段話」的講稿，
 * 手寫過的講稿都遠高於門檻，不會被它動到。
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
);

/** 短於這個長度的引號是行內強調（例如「為什麼只影響局部」），不是要念的句子。 */
const MIN_QUOTE_LENGTH = 16;

/**
 * 低於這個長度的就不是一段答案、是碎片（約 27 秒的口說量）。
 * 有些題目的「面試回答方式」只引了一句提綱，抽出來會變成
 * 「我的理解是，定位 → 分析 → 優化 → 驗證。」這種念不出去的東西。
 * 門檻不宜再高：兩個完整段落約 130 字就是一段合理的簡答，
 * 把它也判成不合格，只會逼著用更生硬的核心答案去取代更好的原句。
 */
const MIN_SCRIPT_LENGTH = 120;

const SCRIPT_HEADING = "## 講稿";

/**
 * 把使用者給的相對路徑收斂進 content/。
 *
 * 這幾支工具會就地改寫檔案，所以路徑必須關在 content/ 裡。
 * 沒有這道守門的話，`--only=../` 會把 repo 裡每一個 .md——README、
 * docs、規格文件——都當成題目檔改寫掉。
 */
export function resolveContentPath(relative = "") {
  const full = path.resolve(CONTENT_DIR, relative);
  if (full !== CONTENT_DIR && !full.startsWith(CONTENT_DIR + path.sep)) {
    throw new Error(`路徑超出 content/：${relative}`);
  }
  return full;
}

/**
 * 一個 `## 標題` 區塊的內容，到下一個 `## ` 或檔尾為止。
 * 結尾不能寫成 `\Z`——那在 JS 正則裡是字面上的 Z，不是檔尾，
 * 會讓任何含大寫 Z 的區塊（ZGC、ZSet、「大寫 A 到 Z」）在該處被截斷。
 */
const SECTION_BODY_RE = (heading) =>
  new RegExp(`^## ${heading}[ \t]*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m");

/** 講稿要插在這些標題之前；都找不到就接在檔尾。 */
const INSERT_BEFORE = ["## 常見追問", "## 相關"];

/**
 * 依「引號前那段旁白在講什麼」挑銜接詞。
 * 旁白本身帶著語意（「一定要誠實補充核心侷限」vs「可以延伸提到」），
 * 一律換成同一個連接詞會把這層資訊丟掉。
 */
const CONNECTOR_RULES = [
  { test: /侷限|限制|代價|缺點|取捨|權衡|誠實|不足|風險/, connector: "不過要誠實說，" },
  { test: /延伸|補充|加分|主動提到|如果能|還可以/, connector: "另外可以補充的是，" },
  { test: /區分|差異|對比|相對|而非|不是/, connector: "要區分清楚的是，" },
  { test: /原因|為什麼|之所以|解釋/, connector: "原因在於，" },
  { test: /舉例|例子|實務|應用|場景|案例/, connector: "舉個實務上的例子，" },
  { test: /最後|收束|總結|結論/, connector: "最後我想強調的是，" },
  { test: /接著|然後|再來|進一步/, connector: "接著，" },
];

/** 沒有旁白線索時，依段落順序給一個不重複的銜接詞。 */
const FALLBACK_CONNECTORS = ["再來，", "另外，", "還有一點，", "另外值得一提的是，"];

const OPENING = "我的理解是，";

/** 開頭已經自帶主語或起手式時，不要再疊一層「我的理解是」。 */
const HAS_OWN_OPENING = /^(我|這|如果|因為|所以|首先|先|在)/;

/**
 * 掃出頂層 `「」` 的內容，以及每個引號前面那段旁白。
 * 內容用 `『』` 做巢狀引號，所以只需要追蹤 `「」` 的深度。
 */
function scanQuotes(text) {
  const segments = [];
  let narration = [];
  let quote = [];
  let depth = 0;

  for (const char of text) {
    if (char === "「") {
      depth += 1;
      if (depth === 1) {
        continue;
      }
    } else if (char === "」") {
      depth -= 1;
      if (depth === 0) {
        segments.push({
          narration: narration.join("").trim(),
          quote: quote.join("").trim(),
        });
        narration = [];
        quote = [];
        continue;
      }
    }

    if (depth === 0) {
      narration.push(char);
    } else {
      quote.push(char);
    }
  }

  return segments;
}

const CJK = "\\u4e00-\\u9fff\\u3000-\\u303f\\uff00-\\uffef";

/**
 * 把引號內容整理成一句可以直接念出口的話。
 * 空白只收斂不刪除——直接刪會把 `Chain of Thought` 黏成 `ChainofThought`；
 * 只有夾在兩個中日韓字元之間的空白才是換行殘留，可以安全拿掉。
 */
function normalizeQuote(raw) {
  return raw
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .replace(new RegExp(`(?<=[${CJK}]) (?=[${CJK}])`, "g"), "")
    .trim()
    .replace(/^[，、。；：]+/, "")
    .replace(/[，、；：。]+$/, "");
}

/** 同一段講稿裡不重複用同一個銜接詞，念起來才不會像跳針。 */
/** 引文式的出處註記唸出來只會打斷節奏，整段拿掉。 */
const CITATION_RE = /[（(]\s*(?:見|參見)[^）)]*[）)]/g;
const WIKI_LINK_RE = /\[\[[^\]]*\]\]/g;

/** 核心答案裡的 `**（1）小標**——` 這種列舉起手式，正好是一個口說段落的界線。 */
const ENUMERATED_RE = /(?=[（(][0-9０-９一二三四五六七八九]+[）)])/;

/** 把書面的核心答案洗成可以念出口的文字。 */
function toSpeakable(text) {
  return text
    .replace(CITATION_RE, "")
    .replace(WIKI_LINK_RE, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .replace(new RegExp(`(?<=[${CJK}]) (?=[${CJK}])`, "g"), "")
    .replace(/——/g, "，")
    .replace(/\s*，\s*/g, "，")
    .trim();
}

/** 把一段連續文字切成大約兩句一組的口說段落。 */
function groupSentences(text, perBeat = 2) {
  const sentences = text.split(/(?<=[。！？])/).map((s) => s.trim()).filter(Boolean);
  const beats = [];

  for (let i = 0; i < sentences.length; i += perBeat) {
    beats.push(sentences.slice(i, i + perBeat).join(""));
  }

  return beats;
}

/**
 * 退而求其次的來源：核心答案。
 * 它是書面語、比引號抽出來的句子生硬，但內容完整，
 * 至少是一段能講完的話，比一句提綱有用得多。
 */
export function buildFromCore(coreAnswer) {
  if (!coreAnswer?.trim()) {
    return null;
  }

  const speakable = toSpeakable(coreAnswer);
  if (!speakable) {
    return null;
  }

  const enumerated = speakable
    .split(ENUMERATED_RE)
    .map((part) => part.trim())
    .filter(Boolean);

  // 列舉前的引言（「排查流程是：」）不該自成一個段落，併進第一步。
  if (enumerated.length >= 2 && !/^[（(]/.test(enumerated[0]) && enumerated[0].length <= 30) {
    enumerated.splice(0, 2, `${enumerated[0]}${enumerated[1]}`);
  }

  const beats =
    enumerated.length >= 3 ? enumerated : groupSentences(speakable);

  return beats.join("\n\n");
}

function pickConnector(narration, index, used) {
  if (index === 0) {
    return "";
  }

  const rule = CONNECTOR_RULES.find(
    ({ test, connector }) => test.test(narration) && !used.has(connector),
  );
  if (rule) {
    used.add(rule.connector);
    return rule.connector;
  }

  const fallback =
    FALLBACK_CONNECTORS.find((item) => !used.has(item)) ??
    FALLBACK_CONNECTORS[FALLBACK_CONNECTORS.length - 1];
  used.add(fallback);
  return fallback;
}

/**
 * 回傳講稿內容；素材不足以組出一段話時回傳 null。
 * 引號是首選來源（那是原文標好的「要講出口的話」），
 * 抽出來太薄的時候才退回核心答案。
 */
export function buildScript(interviewTip, coreAnswer) {
  const fromQuotes = buildFromQuotes(interviewTip);
  if (fromQuotes && fromQuotes.length >= MIN_SCRIPT_LENGTH) {
    return fromQuotes;
  }

  const fromCore = buildFromCore(coreAnswer);
  if (fromCore && fromCore.length >= MIN_SCRIPT_LENGTH) {
    return fromCore;
  }

  // 兩邊都不夠長時，至少交出比較完整的那一份，而不是直接放棄。
  const best = [fromQuotes, fromCore]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0];

  return best ?? null;
}

function buildFromQuotes(interviewTip) {
  const usable = scanQuotes(interviewTip ?? "")
    .map((segment) => ({
      narration: segment.narration,
      quote: normalizeQuote(segment.quote),
    }))
    .filter((segment) => segment.quote.length >= MIN_QUOTE_LENGTH);

  if (usable.length === 0) {
    return null;
  }

  const used = new Set();
  const paragraphs = usable.map((segment, index) => {
    const connector = pickConnector(segment.narration, index, used);
    const opening =
      index === 0 && !HAS_OWN_OPENING.test(segment.quote) ? OPENING : "";

    return `${opening}${connector}${segment.quote}。`;
  });

  return paragraphs.join("\n\n");
}

/** 取出既有的講稿內容，沒有就回傳 null。 */
export function readScriptSection(markdown) {
  const match = markdown.match(SECTION_BODY_RE("講稿"));
  return match ? match[1].trim() : null;
}

/** 就地換掉既有的講稿內容，其餘區塊原封不動。 */
export function replaceScriptSection(markdown, script) {
  return markdown.replace(
    /^(## 講稿[ \t]*$)[\s\S]*?(?=^## |$(?![\s\S]))/m,
    `$1\n\n${script}\n\n`,
  );
}

/** 把講稿插到「常見追問」之前，保持全站一致的區塊順序。 */
export function insertScriptSection(markdown, script) {
  const block = `${SCRIPT_HEADING}\n\n${script}\n`;

  for (const heading of INSERT_BEFORE) {
    const index = markdown.indexOf(`\n${heading}`);
    if (index !== -1) {
      return `${markdown.slice(0, index + 1)}${block}\n${markdown.slice(index + 1)}`;
    }
  }

  return `${markdown.trimEnd()}\n\n${block}`;
}

function extractSection(markdown, heading) {
  const match = markdown.match(SECTION_BODY_RE(heading));
  return match ? match[1].trim() : null;
}

async function collectMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(full)));
    } else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
      files.push(full);
    }
  }

  return files.sort();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const fixShort = args.includes("--fix-short");
  const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

  const root = resolveContentPath(only);
  const files = await collectMarkdownFiles(root);

  const written = [];
  const skipped = [];
  const unusable = [];

  for (const file of files) {
    const markdown = await readFile(file, "utf8");
    const relative = path.relative(CONTENT_DIR, file);

    const existing = readScriptSection(markdown);
    const tooShort = existing !== null && existing.length < MIN_SCRIPT_LENGTH;

    if (existing !== null && !force && !(fixShort && tooShort)) {
      skipped.push(relative);
      continue;
    }

    const tip = extractSection(markdown, "面試回答方式");
    const core = extractSection(markdown, "核心答案");
    const script = buildScript(tip ?? "", core ?? "");

    if (!script || (existing !== null && script.length <= existing.length)) {
      unusable.push(relative);
      continue;
    }

    if (!dryRun) {
      const next =
        existing === null
          ? insertScriptSection(markdown, script)
          : replaceScriptSection(markdown, script);
      await writeFile(file, next, "utf8");
    }
    written.push(relative);
  }

  console.log(`掃描 ${files.length} 篇`);
  console.log(`  ${dryRun ? "可產生" : "已寫入"} ${written.length} 篇講稿`);
  console.log(`  已有講稿跳過 ${skipped.length} 篇`);
  console.log(`  素材不足或改不動需手寫 ${unusable.length} 篇`);
  for (const file of unusable) {
    console.log(`    - ${file}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    // 這是批次改寫內容的工具，堆疊追蹤只會蓋住真正的原因。
    console.error(`錯誤：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
