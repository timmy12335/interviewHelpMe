import type { Meta, StoryObj } from "@storybook/react";

import { sampleQuestion } from "@/components/_fixtures/questions";

import { MdViewer } from "./index";

const meta = {
  title: "Components/MdViewer",
  component: MdViewer,
  tags: ["autodocs"],
} satisfies Meta<typeof MdViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: sampleQuestion.answer,
  },
};

export const Empty: Story = {
  args: {
    value: "",
  },
};

export const LongContent: Story = {
  args: {
    value: `# Java 字串比較完整解析

## 比較方式

| 寫法 | 比較內容 | 適用情境 |
| --- | --- | --- |
| \`==\` | 參考位址 | 判斷是否為同一物件 |
| \`equals\` | 物件內容 | 判斷字串內容是否相同 |

## 程式碼範例

\`\`\`java
String first = new String("interview");
String second = new String("interview");

System.out.println(first == second);      // false
System.out.println(first.equals(second)); // true
\`\`\`

> 實務上比較字串內容時，應優先使用 \`equals\`，並留意 \`null\` 安全性。

更多重點：

- 字串常值可能由字串池共用。
- \`equalsIgnoreCase\` 可忽略英文大小寫。
- 需要排序時可搭配 \`compareTo\`。`,
  },
};
