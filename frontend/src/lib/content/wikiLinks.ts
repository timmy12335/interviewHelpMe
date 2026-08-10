/**
 * 內文的 `[[...]]` 站內連結。
 *
 * 題庫內容用兩種寫法互相引用：
 *   同類別：`[[003-load-balancing.md]]`
 *   跨類別：`[[../backend-engineering/017-consistent-hashing.md]]`
 *
 * 這裡把它們解析成題目座標，再交由呼叫端決定要渲染成什麼。
 */

/** 一則 `[[...]]` 指向的題目座標。 */
export type WikiTarget = {
  categorySlug: string;
  slug: string;
};

/** 解析結果；label 由呼叫端提供的 resolver 決定（通常是題目標題）。 */
export type ResolvedWikiLink = {
  href: string;
  label: string;
};

export type WikiLinkResolver = (target: WikiTarget) => ResolvedWikiLink | null;

const WIKI_LINK_RE = /\[\[([^\][]+)\]\]/g;

/** 去掉編號前綴與副檔名：`017-consistent-hashing.md` → `consistent-hashing`。 */
function fileNameToSlug(fileName: string): string {
  return fileName.replace(/\.md$/i, "").replace(/^\d+-/, "");
}

/**
 * 把 `[[...]]` 的內容解析成題目座標。
 * 無法解析（空字串、只有 `../` 之類）時回傳 null。
 */
export function parseWikiTarget(
  raw: string,
  fromCategorySlug: string,
): WikiTarget | null {
  const target = raw.replace(/^\[\[|\]\]$/g, "").trim();
  if (!target) {
    return null;
  }

  const segments = target.split("/").filter((part) => part && part !== ".");
  const fileName = segments[segments.length - 1];
  if (!fileName || fileName === "..") {
    return null;
  }

  const slug = fileNameToSlug(fileName);
  if (!slug) {
    return null;
  }

  // 倒數第二段若不是 `..`，就是明確指定的類別目錄。
  const parent = segments[segments.length - 2];
  const categorySlug = parent && parent !== ".." ? parent : fromCategorySlug;

  return { categorySlug, slug };
}

/** slug 轉成人類可讀的後備標籤：`consistent-hashing` → `consistent hashing`。 */
export function fallbackLabel(target: WikiTarget): string {
  return target.slug.replace(/-/g, " ");
}

/**
 * Markdown 連結文字裡的 `[` `]` 會破壞語法，必須跳脫。
 * 題目標題確實有含括號的（例如 `== 與 equals() 的差異`），
 * 圓括號只在網址部分有問題，這裡的網址是 slug 組成的，不受影響。
 */
function escapeLinkLabel(label: string): string {
  return label.replace(/([[\]])/g, "\\$1");
}

/**
 * 把內文裡的 `[[...]]` 換成標準 Markdown 連結。
 * resolver 回傳 null（找不到目標）時，保留原樣不動——寧可留下原始寫法，
 * 也不要產生一個指向不存在頁面的連結。
 */
export function replaceWikiLinks(
  markdown: string,
  fromCategorySlug: string,
  resolve: WikiLinkResolver,
): string {
  return markdown.replace(WIKI_LINK_RE, (match, inner: string) => {
    const target = parseWikiTarget(inner, fromCategorySlug);
    if (!target) {
      return match;
    }

    const resolved = resolve(target);
    if (!resolved) {
      return match;
    }

    return `[${escapeLinkLabel(resolved.label)}](${resolved.href})`;
  });
}
