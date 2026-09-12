import { caching } from "./caching";
import { complexity } from "./complexity";
import { systemDesign } from "./system-design";
import type { CheatSheet } from "./types";

/** 全部速查表，順序即列表頁顯示順序。 */
export const cheatSheets: CheatSheet[] = [systemDesign, caching, complexity];

export function getCheatSheet(slug: string): CheatSheet | undefined {
  return cheatSheets.find((sheet) => sheet.slug === slug);
}

export type { Accent, Block, CheatSheet, FlowNode, Section } from "./types";
