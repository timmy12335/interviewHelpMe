import { describe, expect, it } from "vitest";

import { countReadableChars, speakSeconds, readMinutes } from "./readingTime";

describe("countReadableChars", () => {
  it("ignores markdown emphasis, links and code fences", () => {
    expect(countReadableChars("**粗體**")).toBe(2);
    expect(countReadableChars("[標題](/a/b)")).toBe(2);
    expect(countReadableChars("`code`")).toBe(0);
    expect(countReadableChars("```js\nconst a = 1;\n```")).toBe(0);
  });

  it("ignores whitespace", () => {
    expect(countReadableChars("一 二\n三")).toBe(3);
  });

  it("handles empty input", () => {
    expect(countReadableChars("")).toBe(0);
    expect(countReadableChars(undefined)).toBe(0);
  });
});

describe("speakSeconds", () => {
  it("estimates spoken length at 4.5 chars per second", () => {
    expect(speakSeconds("字".repeat(450))).toBe(100);
  });

  it("never reports zero for non-empty text", () => {
    expect(speakSeconds("短")).toBe(1);
  });

  it("reports zero for empty text", () => {
    expect(speakSeconds("")).toBe(0);
  });
});

describe("readMinutes", () => {
  it("estimates reading time at 300 chars per minute, rounded up", () => {
    expect(readMinutes("字".repeat(300))).toBe(1);
    expect(readMinutes("字".repeat(301))).toBe(2);
  });

  it("reports zero for empty text", () => {
    expect(readMinutes("")).toBe(0);
  });
});
