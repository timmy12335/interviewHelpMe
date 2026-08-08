import type { Meta, StoryObj } from "@storybook/react";

import { DifficultyBadge } from "./index";

const meta = {
  title: "Components/DifficultyBadge",
  component: DifficultyBadge,
  tags: ["autodocs"],
  argTypes: {
    difficulty: {
      control: "select",
      options: ["easy", "medium", "hard"],
    },
  },
} satisfies Meta<typeof DifficultyBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    difficulty: "medium",
  },
};

export const Easy: Story = {
  args: {
    difficulty: "easy",
  },
};

export const Hard: Story = {
  args: {
    difficulty: "hard",
  },
};
