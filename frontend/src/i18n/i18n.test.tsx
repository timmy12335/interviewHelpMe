import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { DifficultyBadge } from "@/components/DifficultyBadge";
import { PrefsToggle } from "@/components/PrefsToggle";

import { messages, translate } from "./messages";
import { PreferencesProvider } from "./PreferencesProvider";
import { LOCALE_KEY, THEME_KEY, readLocale, readTheme } from "./prefs";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe("translate", () => {
  it("代入變數", () => {
    expect(translate("zh", "bank.listTitle", { count: 3 })).toBe("題目列表（3）");
    expect(translate("en", "bank.listTitle", { count: 3 })).toBe("Questions (3)");
  });

  it("沒給的變數保留原樣，方便發現漏傳", () => {
    expect(translate("en", "bank.listTitle")).toBe("Questions ({count})");
  });

  it("兩個語系的鍵完全一致，且英文沒有留空", () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.zh).sort());
    for (const [key, value] of Object.entries(messages.en)) {
      expect(value, key).not.toBe("");
    }
  });
});

describe("偏好讀取", () => {
  it("只認得合法值，其餘退回預設", () => {
    expect(readLocale(memoryStorage({ [LOCALE_KEY]: "en" }))).toBe("en");
    expect(readLocale(memoryStorage({ [LOCALE_KEY]: "fr" }))).toBe("zh");
    expect(readLocale(undefined)).toBe("zh");
    expect(readTheme(memoryStorage({ [THEME_KEY]: "light" }))).toBe("light");
    expect(readTheme(memoryStorage({ [THEME_KEY]: "blue" }))).toBeUndefined();
  });
});

describe("PreferencesProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("切換語系與主題會更新畫面、html 屬性並記住選擇", async () => {
    const user = userEvent.setup();
    render(
      <PreferencesProvider>
        <PrefsToggle />
        <DifficultyBadge difficulty="easy" />
      </PreferencesProvider>,
    );

    expect(screen.getByText("簡單")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "切換為英文介面" }));
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LOCALE_KEY)).toBe("en");

    const themeButton = screen.getByRole("button", { name: /theme/ });
    const before = document.documentElement.getAttribute("data-theme");
    await act(async () => {
      await user.click(themeButton);
    });
    const after = document.documentElement.getAttribute("data-theme");
    expect(after).not.toBe(before);
    expect(window.localStorage.getItem(THEME_KEY)).toBe(after);
  });
});
