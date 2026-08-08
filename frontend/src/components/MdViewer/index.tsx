"use client";

import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import { Viewer } from "@bytemd/react";

import "github-markdown-css/github-markdown.css";
import "bytemd/dist/index.css";
import "highlight.js/styles/vs.css";

export interface MdViewerProps {
  /** 要顯示的 Markdown 文字；未提供時顯示空白內容。 */
  value?: string;
}

const plugins = [gfm(), highlight()];

/**
 * 以 GitHub Flavored Markdown 與程式碼語法高亮顯示唯讀內容。
 */
export function MdViewer({ value = "" }: MdViewerProps) {
  return <Viewer value={value} plugins={plugins} />;
}
