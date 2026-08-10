import { describe, expect, it } from "vitest";

import { emphasizeQuotedPhrases } from "./emphasizeQuotes";

describe("emphasizeQuotedPhrases", () => {
  it("bolds a quoted phrase while keeping the quote marks", () => {
    expect(emphasizeQuotedPhrases("先講「AOP 解決什麼問題」——然後…")).toBe(
      "先講「**AOP 解決什麼問題**」——然後…",
    );
  });

  it("bolds every quoted phrase in the text", () => {
    const out = emphasizeQuotedPhrases("說「一」再說「二」");

    expect(out).toBe("說「**一**」再說「**二**」");
  });

  it("leaves text without quotes untouched", () => {
    expect(emphasizeQuotedPhrases("沒有引號的一段話。")).toBe(
      "沒有引號的一段話。",
    );
  });

  it("does not double up when the phrase is already emphasised", () => {
    const input = "先講「**已經是粗體**」。";

    expect(emphasizeQuotedPhrases(input)).toBe(input);
  });

  it("skips long quotations, which are citations rather than lines to say", () => {
    const long = "字".repeat(61);

    expect(emphasizeQuotedPhrases(`他說「${long}」`)).toBe(`他說「${long}」`);
  });

  it("leaves quotes inside inline code alone", () => {
    expect(emphasizeQuotedPhrases("設定 `key「a」` 之後")).toBe(
      "設定 `key「a」` 之後",
    );
  });

  it("leaves quotes inside fenced code blocks alone", () => {
    const input = '```js\nconst s = "「a」";\n```\n然後講「重點」';

    expect(emphasizeQuotedPhrases(input)).toBe(
      '```js\nconst s = "「a」";\n```\n然後講「**重點**」',
    );
  });

  it("does not treat unmatched quote marks as a phrase", () => {
    expect(emphasizeQuotedPhrases("只有一個「開頭")).toBe("只有一個「開頭");
  });
});
