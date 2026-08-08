import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TagList } from "./index";

afterEach(cleanup);

describe("TagList", () => {
  it("renders an empty DOM when tags are empty", () => {
    const { container } = render(<TagList tags={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders every tag when the count does not exceed max", () => {
    render(<TagList tags={["React", "TypeScript"]} max={3} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("renders the first max tags and the hidden count", () => {
    render(<TagList tags={["React", "TypeScript", "Next.js"]} max={2} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.queryByText("Next.js")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });
});
