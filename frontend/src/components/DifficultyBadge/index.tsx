import { Tag } from "antd";

import type { Difficulty } from "@/types/question";

export interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

const difficultyConfig: Record<
  Difficulty,
  { label: string; color: "success" | "warning" | "error" }
> = {
  easy: { label: "簡單", color: "success" },
  medium: { label: "中等", color: "warning" },
  hard: { label: "困難", color: "error" },
};

/**
 * 依照題目難度顯示對應的中文標籤與狀態顏色。
 */
export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { label, color } = difficultyConfig[difficulty];

  return <Tag color={color}>{label}</Tag>;
}
