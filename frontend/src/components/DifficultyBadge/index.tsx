"use client";

import { Tag } from "antd";

import { useT } from "@/i18n/PreferencesProvider";

import type { Difficulty } from "@/types/question";

export interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

const difficultyConfig: Record<
  Difficulty,
  { label: "difficulty.easy" | "difficulty.medium" | "difficulty.hard"; color: "success" | "warning" | "error" }
> = {
  easy: { label: "difficulty.easy", color: "success" },
  medium: { label: "difficulty.medium", color: "warning" },
  hard: { label: "difficulty.hard", color: "error" },
};

/**
 * 依照題目難度顯示對應的中文標籤與狀態顏色。
 */
export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { label, color } = difficultyConfig[difficulty];
  const t = useT();

  return <Tag color={color}>{t(label)}</Tag>;
}
