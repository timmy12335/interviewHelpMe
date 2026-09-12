import type { Block } from "@/data/cheatsheets/types";

type ListBlock = Extract<Block, { kind: "list" }>;

/** 清單：plain 為項目符號、numbered 為編號、warning 為警示樣式。 */
export function ListBlock({ block }: { block: ListBlock }) {
  const variant = block.variant ?? "plain";
  const className = `cs-list cs-list--${variant}`;

  if (variant === "numbered") {
    return (
      <ol className={className}>
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <ul className={className}>
      {block.items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}
