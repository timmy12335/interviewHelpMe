"use client";

import type { ReactNode } from "react";

import { QuestionSider } from "@/components/QuestionSider";
import { usePersistentFlag } from "@/hooks/usePersistentFlag";
import { SIDER_COLLAPSED_KEY } from "@/lib/uiPrefs";
import type { QuestionListItem } from "@/types/question";

export interface PracticeShellProps {
  categorySlug: string;
  categoryName: string;
  questions: QuestionListItem[];
  currentSlug: string;
  children: ReactNode;
}

/**
 * 練習頁外框：持有左側題單的收合狀態。
 * 收合狀態會影響整個頁面的 grid，所以必須由包住兩欄的元件持有。
 */
export function PracticeShell({
  categorySlug,
  categoryName,
  questions,
  currentSlug,
  children,
}: PracticeShellProps) {
  const [collapsed, setCollapsed] = usePersistentFlag(SIDER_COLLAPSED_KEY);

  return (
    <div
      className={`practice-shell${collapsed ? " is-sider-collapsed" : ""}`}
      id="bankQuestionPage"
    >
      <QuestionSider
        categorySlug={categorySlug}
        categoryName={categoryName}
        questions={questions}
        currentSlug={currentSlug}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed()}
      />
      <main className="practice-main">{children}</main>
    </div>
  );
}
