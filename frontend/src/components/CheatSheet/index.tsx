import type { CheatSheet } from "@/data/cheatsheets/types";

import { BlockRenderer } from "./blocks/BlockRenderer";

import "./index.css";

export interface CheatSheetViewProps {
  sheet: CheatSheet;
}

/** 一張速查表：標題 + 若干區塊，每個區塊帶自己的強調色。 */
export function CheatSheetView({ sheet }: CheatSheetViewProps) {
  return (
    <article className="cs-sheet">
      <header className="cs-sheet__head">
        <h1 className="page-title">{sheet.title}</h1>
        <p className="cs-sheet__summary">{sheet.summary}</p>
      </header>

      <div className="cs-sheet__sections">
        {sheet.sections.map((section) => (
          <section
            key={section.title}
            className={`cs-section cs-section--${section.accent ?? "cyan"}`}
          >
            <h2 className="cs-section__title">{section.title}</h2>
            <div className="cs-section__body">
              {section.blocks.map((block, index) => (
                <BlockRenderer key={`${block.kind}-${index}`} block={block} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
