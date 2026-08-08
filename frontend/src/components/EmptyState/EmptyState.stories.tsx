import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "antd";

import { EmptyState } from "./index";

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "尚無題目",
    description: "目前沒有符合條件的題目。",
  },
};

export const WithAction: Story = {
  render: (args) => (
    <EmptyState
      {...args}
      action={<Button type="primary">清除篩選</Button>}
    />
  ),
  args: {
    title: "找不到題目",
    description: "請調整篩選條件後再試一次。",
  },
};
