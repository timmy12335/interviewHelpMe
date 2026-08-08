import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { sampleCategories } from "@/components/_fixtures/categories";

import { CategoryNav } from "./index";

const meta = {
  title: "Components/CategoryNav",
  component: CategoryNav,
  tags: ["autodocs"],
  args: {
    onNavigate: fn(),
  },
} satisfies Meta<typeof CategoryNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    categories: sampleCategories,
    activeSlug: "java-concurrency",
  },
};

export const Empty: Story = {
  args: {
    categories: [],
  },
};
