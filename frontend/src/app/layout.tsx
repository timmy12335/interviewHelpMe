import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Orbitron } from "next/font/google";

import { withBasePath } from "@/lib/paths";

import { AppProviders } from "./providers";

import "./globals.css";

/** 展示用字體；無中文字符，僅套在拉丁字與數字的 HUD 元素上。 */
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InterviewHelpMe",
  description: "面試題練習站 · Interview practice",
};

/** 提供應用程式全域版面與 Ant Design 繁體中文設定。 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // prefs-init.js 會在 hydration 前改寫 data-theme 與 lang，屬預期中的差異。
    <html lang="zh-Hant" className={orbitron.variable} suppressHydrationWarning>
      <head>
        {/* 同步載入：必須在第一次繪製前套用主題，否則淺色使用者會先看到深色畫面。 */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src={withBasePath("/prefs-init.js")} />
      </head>
      <body>
        <AntdRegistry>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
