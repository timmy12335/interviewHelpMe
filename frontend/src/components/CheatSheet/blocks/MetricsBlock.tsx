import type { Block } from "@/data/cheatsheets/types";

type MetricsBlock = Extract<Block, { kind: "metrics" }>;

/** 指標徽章：標籤（徽章）＋ 數值（強調）＋ 一句註解。 */
export function MetricsBlock({ block }: { block: MetricsBlock }) {
  return (
    <dl className="cs-metrics">
      {block.items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="cs-metric">
          <dt className="cs-metric__label">{item.label}</dt>
          <dd className="cs-metric__body">
            <span className="cs-metric__value">{item.value}</span>
            {item.note ? <span className="cs-metric__note">{item.note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
