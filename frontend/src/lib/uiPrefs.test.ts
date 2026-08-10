import { describe, expect, it } from "vitest";

import type { StorageLike } from "./progress";
import { readFlag, writeFlag } from "./uiPrefs";

const KEY = "ihm:ui:test";

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

describe("readFlag", () => {
  it("returns the fallback when nothing is stored", () => {
    expect(readFlag(fakeStorage(), KEY, true)).toBe(true);
    expect(readFlag(fakeStorage(), KEY, false)).toBe(false);
  });

  it("returns the stored value regardless of the fallback", () => {
    expect(readFlag(fakeStorage({ [KEY]: "1" }), KEY, false)).toBe(true);
    expect(readFlag(fakeStorage({ [KEY]: "0" }), KEY, true)).toBe(false);
  });

  it("falls back when the stored value is not recognised", () => {
    expect(readFlag(fakeStorage({ [KEY]: "yes" }), KEY, true)).toBe(true);
  });

  it("falls back when storage is unavailable or blocked", () => {
    expect(readFlag(undefined, KEY, true)).toBe(true);
    expect(readFlag(throwingStorage(), KEY, true)).toBe(true);
  });
});

describe("writeFlag", () => {
  it("round-trips through readFlag", () => {
    const storage = fakeStorage();

    writeFlag(storage, KEY, true);
    expect(readFlag(storage, KEY, false)).toBe(true);

    writeFlag(storage, KEY, false);
    expect(readFlag(storage, KEY, true)).toBe(false);
  });

  it("does not throw when storage is unavailable or blocked", () => {
    expect(() => writeFlag(undefined, KEY, true)).not.toThrow();
    expect(() => writeFlag(throwingStorage(), KEY, true)).not.toThrow();
  });
});
