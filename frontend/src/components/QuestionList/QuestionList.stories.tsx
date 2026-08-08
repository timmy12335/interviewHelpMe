import type { Meta, StoryObj } from "@storybook/react";

import {
  manyTagsQuestion,
  sampleQuestions,
} from "@/components/_fixtures/questions";

import { QuestionList } from "./index";

const meta = {
  title: "Components/QuestionList",
  component: QuestionList,
  tags: ["autodocs"],
} satisfies Meta<typeof QuestionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    questions: sampleQuestions,
  },
};

export const Empty: Story = {
  args: {
    questions: [],
  },
};

export const ManyTags: Story = {
  args: {
    questions: [manyTagsQuestion],
  },
};
