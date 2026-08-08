import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "./index";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders with only the required title", () => {
    render(<EmptyState title="尚無內容" />);

    expect(screen.getByText("尚無內容")).toBeInTheDocument();
  });

  it("renders the title and optional description", () => {
    render(<EmptyState title="尚無題目" description="請稍後再回來查看。" />);

    expect(screen.getByText("尚無題目")).toBeInTheDocument();
    expect(screen.getByText("請稍後再回來查看。")).toBeInTheDocument();
  });

  it("renders an optional action", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        title="找不到內容"
        action={<button onClick={handleClick}>重新整理</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: "重新整理" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
