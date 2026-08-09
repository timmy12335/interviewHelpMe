/**
 * Prefix absolute paths with the GitHub Pages base path.
 * Use for native `<a href>` in CategoryNav / QuestionList only;
 * `next/link` must NOT call this — Next.js applies basePath automatically.
 */
export function withBasePath(
  path: string,
  basePath: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "",
): string {
  if (!path.startsWith("/")) return path;
  const base = basePath.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}
