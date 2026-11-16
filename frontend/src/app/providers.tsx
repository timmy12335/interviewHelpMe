"use client";

import { ConfigProvider, theme, type ThemeConfig } from "antd";
import enUS from "antd/locale/en_US";
import zhTW from "antd/locale/zh_TW";
import type { ReactNode } from "react";

import { PreferencesProvider, usePreferences } from "@/i18n/PreferencesProvider";
import { BasicLayout } from "@/layouts/BasicLayout";

/**
 * 深空 HUD 主題。
 * 必須留在 client 端：darkAlgorithm 是函式，無法跨 RSC 邊界序列化。
 */
const hudTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#22d3ee",
    colorInfo: "#22d3ee",
    colorSuccess: "#4ade80",
    colorWarning: "#fbbf24",
    colorError: "#fb7185",
    colorBgBase: "#04060e",
    colorTextBase: "#dce7fb",
    borderRadius: 0,
    fontFamily:
      '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", -apple-system, sans-serif',
  },
  components: {
    Layout: {
      siderBg: "transparent",
      bodyBg: "transparent",
      headerBg: "transparent",
    },
    Menu: {
      itemBg: "transparent",
      darkItemBg: "transparent",
      subMenuItemBg: "transparent",
    },
    Card: {
      colorBgContainer: "transparent",
    },
  },
};

/** 淺色主題：同一套切角版型，換成白底深字與加深的強調色以維持對比。 */
const lightTheme: ThemeConfig = {
  ...hudTheme,
  algorithm: theme.defaultAlgorithm,
  token: {
    ...hudTheme.token,
    colorPrimary: "#0e7490",
    colorInfo: "#0e7490",
    colorSuccess: "#15803d",
    colorWarning: "#b45309",
    colorError: "#be123c",
    colorBgBase: "#f5f7fb",
    colorTextBase: "#0f172a",
  },
};

function ThemedApp({ children }: { children: ReactNode }) {
  const { locale, theme: mode } = usePreferences();

  return (
    <ConfigProvider
      locale={locale === "en" ? enUS : zhTW}
      theme={mode === "light" ? lightTheme : hudTheme}
    >
      <BasicLayout>{children}</BasicLayout>
    </ConfigProvider>
  );
}

/** 全站偏好（語系、主題）、Ant Design 設定與版面。 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <ThemedApp>{children}</ThemedApp>
    </PreferencesProvider>
  );
}
