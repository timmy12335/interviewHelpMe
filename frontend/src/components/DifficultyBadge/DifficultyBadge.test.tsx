import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DifficultyBadge } from "./index";

afterEach(cleanup);

describe("DifficultyBadge", () => {
  it.each([
    ["easy", "簡單", "success"],
    ["medium", "中等", "warning"],
    ["hard", "困難", "error"],
  ] as const)(
    "renders %s difficulty with the correct label and color",
    (difficulty, label, color) => {
      render(<DifficultyBadge difficulty={difficulty} />);

      const badge = screen.getByText(label);

      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(`ant-tag-${color}`);
    },
  );
});
