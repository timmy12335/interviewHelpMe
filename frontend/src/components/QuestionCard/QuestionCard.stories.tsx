import type { Meta, StoryObj } from "@storybook/react";

import { sampleQuestion } from "@/components/_fixtures/questions";
import type { Question } from "@/types/question";

import { QuestionCard } from "./index";

const longContentQuestion: Question = {
  ...sampleQuestion,
  id: "question-long-content",
  slug: "distributed-cache-design",
  title: "請設計可承受高流量的分散式快取策略",
  difficulty: "hard",
  tags: ["System Design", "Cache", "Redis", "High Availability"],
  content: `
## 情境

某服務在尖峰時段每秒需要處理十萬次讀取，資料允許短暫延遲，但不可因單一節點故障而中斷。

請說明：

1. 快取鍵與過期策略
2. 熱點資料與快取擊穿的處理方式
3. 節點故障時的降級與復原流程
4. 一致性、可用性及成本之間的取捨
  `,
  answer: `
可採用 Redis Cluster 分散資料，搭配隨機化 TTL、請求合併與多層快取降低熱點壓力。

故障時應以逾時、熔斷和限流保護來源服務，並透過監控指標驗證命中率與復原時間。
  `,
};

const meta = {
  title: "Components/QuestionCard",
  component: QuestionCard,
  tags: ["autodocs"],
  args: {
    question: sampleQuestion,
  },
} satisfies Meta<typeof QuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAnswer: Story = {
  args: {
    showAnswer: true,
  },
};

export const PracticeMode: Story = {
  args: {
    showAnswer: false,
  },
};

export const LongContent: Story = {
  args: {
    question: longContentQuestion,
    href: "/questions/distributed-cache-design",
  },
};
