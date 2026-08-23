/**
 * Markdown 渲染管線的 XSS 回歸測試。
 *
 * bytemd 的 pipeline 是 `allowDangerousHtml: true` + rehype-raw，**再接**
 * rehype-sanitize。也就是說原始 HTML 會先被解析進語法樹，才被清理掉——
 * 安全與否完全取決於那層 sanitize 是否真的生效。這件事不能靠讀原始碼推論，
 * 必須對真正的渲染路徑實測。
 *
 * 威脅模型：內容來自本 repo 的 Markdown，不是使用者輸入，所以這裡防的是
 * 「惡意或被入侵的內容貢獻」，而不是即時的使用者攻擊。即便如此，一個被合併
 * 的惡意 PR 就足以在所有讀者的瀏覽器上執行程式碼，所以這條防線要有測試守著。
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MdViewer } from "./index";

afterEach(cleanup);

/** 渲染後實際進到 DOM 的 HTML。 */
function renderMarkdown(value: string): HTMLElement {
  const { container } = render(<MdViewer value={value} />);
  return container;
}

describe("MdViewer 的 XSS 防線", () => {
  it("移除 script 標籤", () => {
    const container = renderMarkdown('正常文字 <script>window.__xss = 1;</script> 後續');

    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toContain("window.__xss");
  });

  it("移除事件處理器屬性", () => {
    const container = renderMarkdown('<img src="x" onerror="window.__xss = 1">');

    expect(container.innerHTML).not.toContain("onerror");
    expect(container.querySelector("[onerror]")).toBeNull();
  });

  it("移除 svg 的 onload", () => {
    const container = renderMarkdown('<svg onload="window.__xss = 1"></svg>');

    expect(container.innerHTML).not.toContain("onload");
  });

  it("擋掉 Markdown 連結裡的 javascript: 協定", () => {
    const container = renderMarkdown("[點我](javascript:window.__xss=1)");
    const href = container.querySelector("a")?.getAttribute("href");

    expect(href ?? "").not.toMatch(/^javascript:/i);
  });

  it("擋掉原始 HTML 連結裡的 javascript: 協定", () => {
    const container = renderMarkdown('<a href="javascript:window.__xss=1">點我</a>');
    const href = container.querySelector("a")?.getAttribute("href");

    expect(href ?? "").not.toMatch(/^javascript:/i);
  });

  it("擋掉 data: 協定的內嵌 HTML", () => {
    const container = renderMarkdown(
      '[點我](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    );
    const href = container.querySelector("a")?.getAttribute("href");

    expect(href ?? "").not.toMatch(/^data:text\/html/i);
  });

  it("移除 iframe", () => {
    const container = renderMarkdown('<iframe src="https://evil.example"></iframe>');

    expect(container.querySelector("iframe")).toBeNull();
  });

  it("移除 style 標籤與 form", () => {
    const container = renderMarkdown(
      '<style>body{display:none}</style><form action="https://evil.example"><input name="p"></form>',
    );

    expect(container.querySelector("style")).toBeNull();
    expect(container.querySelector("form")).toBeNull();
  });

  it("移除 object 與 embed", () => {
    const container = renderMarkdown(
      '<object data="https://evil.example"></object><embed src="https://evil.example">',
    );

    expect(container.querySelector("object")).toBeNull();
    expect(container.querySelector("embed")).toBeNull();
  });

  it("保留正常內容不誤殺", () => {
    const container = renderMarkdown(
      "**粗體**與 `程式碼`，還有 [站內連結](/category/java/question/x/)。",
    );

    expect(container.querySelector("strong")).not.toBeNull();
    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/category/java/question/x/",
    );
  });
});
