import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sampleCategories } from "@/components/_fixtures/categories";

import { CategoryNav } from "./index";

afterEach(cleanup);

describe("CategoryNav", () => {
  it("renders category names, optional counts, and default hrefs", () => {
    const categories = [
      sampleCategories[0],
      { ...sampleCategories[1], questionCount: undefined },
    ];

    render(<CategoryNav categories={categories} />);

    expect(screen.getByRole("link", { name: "Java（24）" })).toHaveAttribute(
      "href",
      "/category/java/",
    );
    expect(screen.getByRole("link", { name: "Java 併發" })).toHaveAttribute(
      "href",
      "/category/java-concurrency/",
    );
  });

  it("marks only the active category as the current page", () => {
    render(
      <CategoryNav categories={sampleCategories} activeSlug="java-concurrency" />,
    );

    expect(screen.getByRole("link", { name: "Java 併發（16）" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Java（24）" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("uses an injected href builder", () => {
    render(
      <CategoryNav
        categories={[sampleCategories[0]]}
        getHref={(category) => `/questions?category=${category.slug}`}
      />,
    );

    expect(screen.getByRole("link", { name: "Java（24）" })).toHaveAttribute(
      "href",
      "/questions?category=java",
    );
  });

  it("prevents default navigation and calls the injected handler", () => {
    const onNavigate = vi.fn();
    render(
      <CategoryNav
        categories={[sampleCategories[0]]}
        onNavigate={onNavigate}
      />,
    );
    const link = screen.getByRole("link", { name: "Java（24）" });

    expect(fireEvent.click(link)).toBe(false);
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith(sampleCategories[0]);
  });

  it("does not render links when categories are empty", () => {
    render(<CategoryNav categories={[]} />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
