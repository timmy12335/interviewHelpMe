import { Spin } from "antd";

export interface LoadingStateProps {
  /** 載入指示下方的提示文字。 */
  tip?: string;
  /** 是否在至少四成視窗高度的區域中置中顯示。 */
  fullscreen?: boolean;
}

/**
 * 顯示統一的載入指示，並可在較大的內容區域中置中呈現。
 */
export function LoadingState({
  tip = "載入中…",
  fullscreen = false,
}: LoadingStateProps) {
  const spinner = (
    <Spin tip={tip}>
      {/* Spin 需有子元素才會在 nested 模式顯示 tip。 */}
      <span aria-hidden="true" />
    </Spin>
  );

  if (!fullscreen) {
    return spinner;
  }

  return (
    <div
      data-testid="loading-state"
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "40vh",
      }}
    >
      {spinner}
    </div>
  );
}
