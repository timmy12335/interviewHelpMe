import type { Block } from "@/data/cheatsheets/types";

import { BlockRenderer } from "./BlockRenderer";

type CompareBlock = Extract<Block, { kind: "compare" }>;

/** 並排比較卡；每張卡可內嵌其他原語，限一層（由測試把關不得再含 compare）。 */
export function CompareBlock({ block }: { block: CompareBlock }) {
  return (
    <div className="cs-compare">
      {block.items.map((item) => (
        <article key={item.name} className="cs-compare__card">
          <h4 className="cs-compare__name">{item.name}</h4>
          {item.blocks.map((inner, index) => (
            <BlockRenderer key={`${inner.kind}-${index}`} block={inner} />
          ))}
        </article>
      ))}
    </div>
  );
}
