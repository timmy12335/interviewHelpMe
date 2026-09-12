import type { CheatSheet } from "./types";

export const systemDesign: CheatSheet = {
  slug: "system-design",
  title: "系統設計速查",
  summary: "高可用、高吞吐、高擴展三條主線的判準、指標與常見做法。",
  tags: ["系統設計", "高可用", "擴展性"],
  relatedQuestions: [
    "system-design/system-design-methodology",
    "system-design/capacity-estimation",
    "system-design/availability-tiers",
  ],
  sections: [
    {
      title: "高可用",
      accent: "cyan",
      blocks: [
        {
          kind: "metrics",
          items: [
            { label: "4 nines", value: "99.99%", note: "每天可停機 8.64 秒" },
            { label: "5 nines", value: "99.999%", note: "每天可停機 864 毫秒" },
            { label: "RTO", value: "Recovery Time Objective", note: "多久要恢復" },
            { label: "RPO", value: "Recovery Point Objective", note: "可以丟多少資料" },
          ],
        },
        {
          kind: "list",
          variant: "numbered",
          items: ["冗餘：任何元件都要有備份", "消除單點故障：沒有任何一個節點掛掉會讓整體不可用"],
        },
        {
          kind: "compare",
          items: [
            {
              name: "Hot-Hot",
              blocks: [
                {
                  kind: "flow",
                  layers: [
                    [{ label: "API Gateway", tone: "amber" }],
                    [
                      { label: "Order Service", tone: "rose" },
                      { label: "Order Service", tone: "rose" },
                    ],
                    [{ label: "Payment Service", tone: "cyan" }],
                  ],
                },
                { kind: "list", items: ["兩邊同時服務流量", "切換無感，但成本是雙倍"] },
              ],
            },
            {
              name: "Hot-Warm",
              blocks: [
                {
                  kind: "flow",
                  layers: [
                    [{ label: "API Gateway", tone: "amber" }],
                    [
                      { label: "Order Service", tone: "lime" },
                      { label: "Order Service (standby)", tone: "violet" },
                    ],
                    [{ label: "Payment Service", tone: "cyan" }],
                  ],
                },
                { kind: "list", items: ["備援待命不接流量", "成本低，但切換有中斷視窗"] },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "高吞吐",
      accent: "violet",
      blocks: [
        {
          kind: "metrics",
          items: [
            { label: "QPS", value: "Queries per second", note: "每秒查詢數" },
            { label: "TPS", value: "Transactions per second", note: "每秒交易數" },
          ],
        },
        {
          kind: "list",
          variant: "numbered",
          items: ["快取：先擋掉重複的讀", "找出瓶頸：先量再改", "加執行緒與實例", "尖峰管理：削峰、限流"],
        },
      ],
    },
    {
      title: "高擴展",
      accent: "lime",
      blocks: [
        {
          kind: "metrics",
          items: [{ label: "RT", value: "Response Time", note: "回應時間" }],
        },
        {
          kind: "list",
          variant: "numbered",
          items: ["服務職責切分乾淨", "善用負載平衡與服務發現", "容量規劃要先於流量到來"],
        },
      ],
    },
  ],
};
