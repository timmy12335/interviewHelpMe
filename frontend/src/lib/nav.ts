import type { MenuItem } from "@/config/menu";

/**
 * 去掉結尾斜線後再比較。
 *
 * next.config 設了 trailingSlash，預渲染與瀏覽器取得的 pathname 可能一個帶斜線、
 * 一個不帶；正規化後兩邊才會得到相同的結果，不會製造 hydration 落差。
 */
export function normalisePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** 路徑本身或它底下的子頁面。 */
function matchesPrefix(currentPath: string, prefix: string): boolean {
  const current = normalisePath(currentPath);
  const target = normalisePath(prefix);

  // 首頁只在完全相同時才算命中，否則它會匹配到站上每一個頁面。
  return target === "/" ? current === "/" : current === target || current.startsWith(`${target}/`);
}

/** 目前路徑是否落在這個選單項目底下。 */
export function isActiveMenuItem(pathname: string, item: MenuItem): boolean {
  return (
    matchesPrefix(pathname, item.path) ||
    (item.matchPrefixes ?? []).some((prefix) => matchesPrefix(pathname, prefix))
  );
}
