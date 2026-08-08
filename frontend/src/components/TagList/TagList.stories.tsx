import type { Meta, StoryObj } from "@storybook/react";

import { TagList } from "./index";

const meta = {
  title: "Components/TagList",
  component: TagList,
  tags: ["autodocs"],
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: ["React", "TypeScript", "Next.js"],
  },
};

export const Empty: Story = {
  args: {
    tags: [],
  },
};

export const ManyTags: Story = {
  args: {
    tags: ["React", "TypeScript", "Next.js", "Ant Design", "Vitest"],
    max: 3,
  },
};
