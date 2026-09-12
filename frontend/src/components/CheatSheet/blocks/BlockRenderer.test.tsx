import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

  // 速查表的資料是手寫的，同一層出現兩個同名節點（兩台 Order Service）、
  // 或兩列有相同的儲存格，都是很自然的寫法。如果 key 取自內容本身，
  // 這種資料會讓 React 噴 duplicate key 警告——畫面看起來對，主控台才有跡象。
  // 這條測試把「key 必須唯一」變成機器檢查，而不是靠下次有人剛好看主控台。
  it("內容重複的資料不會產生 React key 警告", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const blocks: Block[] = [
      {
        kind: "flow",
        layers: [
          [{ label: "API Gateway" }],
          [{ label: "Order Service" }, { label: "Order Service" }],
        ],
      },
      { kind: "list", items: ["同上", "同上"] },
      { kind: "metrics", items: [{ label: "RT", value: "1ms" }, { label: "RT", value: "2ms" }] },
      {
        kind: "table",
        head: ["讀", "讀"],
        rows: [
          ["O(1)", "O(1)"],
          ["O(1)", "O(1)"],
        ],
      },
      {
        kind: "compare",
        items: [
          { name: "同名", blocks: [{ kind: "list", items: ["a"] }] },
          { name: "同名", blocks: [{ kind: "list", items: ["a"] }] },
        ],
      },
    ];

    blocks.forEach((block) => render(<BlockRenderer block={block} />));

    const keyWarnings = spy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === "string" && arg.includes("same key")),
    );
    expect(keyWarnings).toEqual([]);

    spy.mockRestore();
  });
});
