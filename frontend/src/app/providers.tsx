"use client";

import { ConfigProvider, theme } from "antd";
import zhTW from "antd/locale/zh_TW";
import type { ReactNode } from "react";

import { BasicLayout } from "@/layouts/BasicLayout";

/**
 * 深空 HUD 主題。
 * 必須留在 client 端：darkAlgorithm 是函式，無法跨 RSC 邊界序列化。
 */
const hudTheme = {
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

/** 全站 Ant Design 設定與版面。 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={zhTW} theme={hudTheme}>
      <BasicLayout>{children}</BasicLayout>
    </ConfigProvider>
  );
}
