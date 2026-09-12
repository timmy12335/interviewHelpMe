import type { Block } from "@/data/cheatsheets/types";

type TableBlock = Extract<Block, { kind: "table" }>;

/** 表格：欄數一致性由 cheatSheets.test.ts 把關，這裡直接渲染。 */
export function TableBlock({ block }: { block: TableBlock }) {
  return (
    <div className="cs-table-wrap">
      <table className="cs-table">
        <thead>
          <tr>
            {block.head.map((cell, cellIndex) => (
              <th key={`${cell}-${cellIndex}`} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
