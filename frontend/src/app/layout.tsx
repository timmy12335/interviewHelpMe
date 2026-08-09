import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Orbitron } from "next/font/google";

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
  description: "面試題練習站",
};

/** 提供應用程式全域版面與 Ant Design 繁體中文設定。 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={orbitron.variable}>
      <body>
        <AntdRegistry>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
