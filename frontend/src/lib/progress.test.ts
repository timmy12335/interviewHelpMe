import { describe, expect, it } from "vitest";

import {
  REVIEW_AFTER_DAYS,
  answerAtKey,
  answerKey,
  isDueForReview,
  readDraft,
  readProgress,
  saveDraft,
  type StorageLike,
} from "./progress";

const DAY_MS = 86_400_000;
const NOW = Date.UTC(2026, 7, 10);

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const storage: StorageLike & { map: Map<string, string> } = {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
  return storage;
}

function throwingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
}

describe("isDueForReview", () => {
  it("returns false when there is no timestamp", () => {
    expect(isDueForReview(undefined, NOW)).toBe(false);
  });

  it("returns false before the review window elapses", () => {
    expect(isDueForReview(NOW - (REVIEW_AFTER_DAYS - 1) * DAY_MS, NOW)).toBe(
      false,
    );
  });

  it("returns true once the review window has elapsed", () => {
    expect(isDueForReview(NOW - REVIEW_AFTER_DAYS * DAY_MS, NOW)).toBe(true);
  });

  it("ignores unparseable timestamps", () => {
    expect(isDueForReview(Number.NaN, NOW)).toBe(false);
  });
});

describe("saveDraft", () => {
  it("stores the draft and its timestamp", () => {
    const storage = fakeStorage();

    saveDraft(storage, "java-001", "我的答案", NOW);

    expect(storage.map.get(answerKey("java-001"))).toBe("我的答案");
    expect(storage.map.get(answerAtKey("java-001"))).toBe(String(NOW));
  });

  it("clears the timestamp when the draft becomes blank", () => {
    const storage = fakeStorage();

    saveDraft(storage, "java-001", "我的答案", NOW);
    saveDraft(storage, "java-001", "   ", NOW);

    expect(storage.map.get(answerAtKey("java-001"))).toBe("");
  });

  it("does not throw when storage is unavailable", () => {
    expect(() => saveDraft(undefined, "java-001", "x", NOW)).not.toThrow();
    expect(() => saveDraft(throwingStorage(), "java-001", "x", NOW)).not.toThrow();
  });
});

describe("readDraft", () => {
  it("returns an empty string when nothing is stored", () => {
    expect(readDraft(fakeStorage(), "java-001")).toBe("");
    expect(readDraft(undefined, "java-001")).toBe("");
  });

  it("returns the stored draft", () => {
    const storage = fakeStorage({ [answerKey("java-001")]: "草稿" });

    expect(readDraft(storage, "java-001")).toBe("草稿");
  });
});

describe("readProgress", () => {
  it("counts only questions with a non-blank draft", () => {
    const storage = fakeStorage({
      [answerKey("a")]: "有寫",
      [answerKey("b")]: "   ",
    });

    const { answeredIds } = readProgress(storage, ["a", "b", "c"], NOW);

    expect([...answeredIds]).toEqual(["a"]);
  });

  it("flags answered questions past the review window", () => {
    const storage = fakeStorage({
      [answerKey("fresh")]: "有寫",
      [answerAtKey("fresh")]: String(NOW - DAY_MS),
      [answerKey("stale")]: "有寫",
      [answerAtKey("stale")]: String(NOW - (REVIEW_AFTER_DAYS + 3) * DAY_MS),
    });

    const { answeredIds, dueIds } = readProgress(
      storage,
      ["fresh", "stale"],
      NOW,
    );

    expect(answeredIds.size).toBe(2);
    expect([...dueIds]).toEqual(["stale"]);
  });

  it("returns empty progress when storage is unavailable or blocked", () => {
    expect(readProgress(undefined, ["a"], NOW).answeredIds.size).toBe(0);
    expect(readProgress(throwingStorage(), ["a"], NOW).answeredIds.size).toBe(0);
  });
});
