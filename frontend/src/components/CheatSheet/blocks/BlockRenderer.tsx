import type { Block } from "@/data/cheatsheets/types";

import { CompareBlock } from "./CompareBlock";
import { FlowBlock } from "./FlowBlock";
import { ListBlock } from "./ListBlock";
import { MetricsBlock } from "./MetricsBlock";
import { TableBlock } from "./TableBlock";

/** 依 kind 分派到對應的原語元件。 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "metrics":
      return <MetricsBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "flow":
      return <FlowBlock block={block} />;
    case "compare":
      return <CompareBlock block={block} />;
    case "table":
      return <TableBlock block={block} />;
  }
}
