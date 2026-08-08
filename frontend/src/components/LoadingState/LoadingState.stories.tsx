import type { Meta, StoryObj } from "@storybook/react";

import { LoadingState } from "./index";

const meta = {
  title: "Components/LoadingState",
  component: LoadingState,
  tags: ["autodocs"],
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Fullscreen: Story = {
  args: {
    fullscreen: true,
    tip: "正在準備題目…",
  },
};
