import { Fragment } from "react";

import type { Block } from "@/data/cheatsheets/types";

type FlowBlock = Extract<Block, { kind: "flow" }>;

/**
 * 分層節點圖：相鄰兩層之間以一段連接線示意「全連接」。
 *
 * 刻意不做通用圖渲染——參考圖上的小圖都是兩到三層的扇出／匯聚，
 * 分層模型就夠用，而且純 CSS 可畫，不需要 SVG 路徑計算。
 */
export function FlowBlock({ block }: { block: FlowBlock }) {
  return (
    <div className="cs-flow">
      {block.layers.map((layer, layerIndex) => (
        <Fragment key={layer.map((node) => node.label).join("|")}>
          {layerIndex > 0 ? <div className="cs-flow__link" aria-hidden="true" /> : null}
          <div className="cs-flow__layer">
            {layer.map((node) => (
              <span
                key={node.label}
                className={`cs-flow__node cs-flow__node--${node.tone ?? "cyan"}`}
              >
                {node.label}
              </span>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
