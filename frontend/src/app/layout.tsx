import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zhTW from "antd/locale/zh_TW";

import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewHelpMe",
  description: "面試準備共用元件展示",
};

/** 提供應用程式全域版面與 Ant Design 繁體中文設定。 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhTW}>{children}</ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
