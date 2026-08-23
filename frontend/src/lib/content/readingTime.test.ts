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
  it("estimates Chinese speech at 4.5 characters per second", () => {
    expect(speakSeconds("字".repeat(450))).toBe(100);
  });

  it("reads latin text far faster per character than Chinese", () => {
    // 同樣 140 個字元，中文要 31 秒，英文只要 10 秒。
    expect(speakSeconds("a".repeat(140))).toBe(10);
    expect(speakSeconds("字".repeat(140))).toBe(31);
  });

  it("does not charge speaking time to punctuation", () => {
    expect(speakSeconds("，、。；：！？「」（）")).toBe(0);
    expect(speakSeconds("字".repeat(45) + "，、。；：")).toBe(10);
  });

  it("never reports zero for non-empty text", () => {
    expect(speakSeconds("短")).toBe(1);
  });

  it("reports zero for empty text", () => {
    expect(speakSeconds("")).toBe(0);
  });
});

describe("readMinutes", () => {
  it("estimates Chinese reading at 300 characters per minute, rounded up", () => {
    expect(readMinutes("字".repeat(300))).toBe(1);
    expect(readMinutes("字".repeat(301))).toBe(2);
  });

  it("reads latin text faster per character than Chinese", () => {
    expect(readMinutes("a".repeat(900))).toBe(1);
  });

  it("reports zero for empty text", () => {
    expect(readMinutes("")).toBe(0);
  });
});
