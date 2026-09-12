import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Block } from "@/data/cheatsheets/types";

import { BlockRenderer } from "./BlockRenderer";

afterEach(cleanup);

describe("BlockRenderer", () => {
  it("metrics：標籤、數值與註解都出現", () => {
    const block: Block = {
      kind: "metrics",
      items: [{ label: "4 nines", value: "99.99%", note: "每天 8.64 秒" }],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("4 nines")).toBeInTheDocument();
    expect(screen.getByText("99.99%")).toBeInTheDocument();
    expect(screen.getByText("每天 8.64 秒")).toBeInTheDocument();
  });

  it("list：每個項目都出現", () => {
    const block: Block = { kind: "list", variant: "numbered", items: ["冗餘", "無單點"] };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("冗餘")).toBeInTheDocument();
    expect(screen.getByText("無單點")).toBeInTheDocument();
  });

  it("flow：每一層的節點都出現", () => {
    const block: Block = {
      kind: "flow",
      layers: [[{ label: "API Gateway" }], [{ label: "Order Service" }]],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("API Gateway")).toBeInTheDocument();
    expect(screen.getByText("Order Service")).toBeInTheDocument();
  });

  it("table：表頭與儲存格都出現", () => {
    const block: Block = {
      kind: "table",
      head: ["策略", "一致性"],
      rows: [["Cache Aside", "最終一致"]],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.getByText("Cache Aside")).toBeInTheDocument();
  });

  it("compare：卡片名稱與內嵌 block 都出現", () => {
    const block: Block = {
      kind: "compare",
      items: [{ name: "Hot-Hot", blocks: [{ kind: "list", items: ["雙倍成本"] }] }],
    };
    render(<BlockRenderer block={block} />);

    expect(screen.getByText("Hot-Hot")).toBeInTheDocument();
    expect(screen.getByText("雙倍成本")).toBeInTheDocument();
  });
});
