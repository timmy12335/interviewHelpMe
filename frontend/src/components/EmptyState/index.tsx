import type { ReactNode } from "react";
import { Empty } from "antd";

export interface EmptyStateProps {
  /** 空狀態的主要標題。 */
  title: ReactNode;
  /** 補充說明，可省略。 */
  description?: ReactNode;
  /** 顯示於空狀態下方的操作內容。 */
  action?: ReactNode;
}

/**
 * 以一致的版型顯示無資料或無搜尋結果等空狀態。
 */
export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Empty
      description={
        <div>
          <div>{title}</div>
          {description && <div>{description}</div>}
        </div>
      }
    >
      {action}
    </Empty>
  );
}
