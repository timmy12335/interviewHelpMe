import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zhTW from "antd/locale/zh_TW";

import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewHelpMe",
  description: "面試題練習站",
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
          <ConfigProvider locale={zhTW}>
            <SiteHeader />
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
