import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LoadingState } from "./index";

afterEach(cleanup);

describe("LoadingState", () => {
  it("renders the default Traditional Chinese tip", () => {
    render(<LoadingState />);

    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });

  it("renders a custom tip", () => {
    render(<LoadingState tip="正在準備題目…" />);

    expect(screen.getByText("正在準備題目…")).toBeInTheDocument();
  });

  it("centers fullscreen loading with a minimum height", () => {
    render(<LoadingState fullscreen />);

    expect(screen.getByTestId("loading-state")).toHaveStyle({
      alignItems: "center",
      display: "flex",
      justifyContent: "center",
      minHeight: "40vh",
    });
  });
});
