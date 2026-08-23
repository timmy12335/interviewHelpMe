/**
 * 「詳細解析」在內容裡幾乎都寫成一連串 `**小標**：內文` 的段落
 * （1290 段裡有 968 段，約 75%）。把這個既有訊號解析出來，UI 才能
 * 只先攤開小標讓人掃描，而不是一次倒出一整片文字。
 */

import type { DetailBlock } from "@/types/question";

/** 段落開頭的 `**小標**：`。冒號是必要條件，純粗體強調句不算小標。 */
const LEAD_IN_RE = /^\*\*([^*\n]+)\*\*[：:]\s*/;

const FENCE_RE = /^\s*```/;

/**
 * 依空行切段，但程式碼區塊內的空行不算分隔。
 */
function toParagraphs(text: string): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];
  let inFence = false;

  const flush = () => {
    const joined = current.join("\n").trim();
    if (joined) {
      paragraphs.push(joined);
    }
    current = [];
  };

  for (const line of text.split("\n")) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      current.push(line);
      continue;
    }

    if (!inFence && !line.trim()) {
      flush();
      continue;
    }

    current.push(line);
  }

  flush();
  return paragraphs;
}

/**
 * 把詳細解析切成可各自收合的小塊。
 * 沒有小標的段落會併入上一塊；若一開始就沒有小標，則自成一個無標題的開場塊。
 */
export function splitDetailBlocks(detail?: string): DetailBlock[] {
  if (!detail?.trim()) {
    return [];
  }

  const blocks: DetailBlock[] = [];

  for (const paragraph of toParagraphs(detail)) {
    const match = paragraph.match(LEAD_IN_RE);

    if (match) {
      blocks.push({
        heading: match[1].trim(),
        body: paragraph.slice(match[0].length).trim(),
      });
      continue;
    }

    const previous = blocks[blocks.length - 1];
    if (previous) {
      blocks[blocks.length - 1] = {
        ...previous,
        body: `${previous.body}\n\n${paragraph}`.trim(),
      };
      continue;
    }

    blocks.push({ heading: undefined, body: paragraph });
  }

  return blocks;
}
