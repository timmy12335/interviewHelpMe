"use client";

import { GithubFilled } from "@ant-design/icons";
import { ProLayout } from "@ant-design/pro-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { GlobalFooter } from "@/components/GlobalFooter";
import { SearchInput } from "@/components/SearchInput";
import { menus } from "@/config/menu";

import "./index.css";

/** 站台圖示；以行內 SVG 取代圖片檔，靜態匯出時無額外資產。 */
function Logo() {
  return (
    <span className="basic-layout__logo" aria-hidden>
      <svg viewBox="0 0 32 32" width="30" height="30" fill="none">
        <path
          d="M16 2.4 28 9.2v13.6L16 29.6 4 22.8V9.2z"
          stroke="#22d3ee"
          strokeWidth="1.3"
        />
        <path
          d="M16 7.6 23.6 12v8L16 24.4 8.4 20v-8z"
          stroke="#a855f7"
          strokeWidth="1"
          opacity="0.75"
        />
        <circle cx="16" cy="16" r="2.6" fill="#22d3ee" />
      </svg>
    </span>
  );
}

/** 全站通用版面：Ant Design ProLayout 頂部導覽 + 底部欄。 */
export function BasicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div id="basicLayout">
      <ProLayout
        title="InterviewHelpMe"
        layout="top"
        logo={<Logo />}
        location={{ pathname }}
        avatarProps={undefined}
        actionsRender={(props) => {
          if (props.isMobile) {
            return [];
          }

          return [
            <SearchInput key="search" />,
            <a
              key="github"
              className="basic-layout__github"
              href="https://github.com/timmy12335/interviewHelpMe"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <GithubFilled />
            </a>,
          ];
        }}
        headerTitleRender={(logo, title) => (
          <Link href="/" className="basic-layout__brand">
            {logo}
            {title}
          </Link>
        )}
        footerRender={() => <GlobalFooter />}
        menuDataRender={() => menus}
        menuItemRender={(item, dom) => (
          <Link href={item.path || "/"} target={item.target}>
            {dom}
          </Link>
        )}
      >
        {children}
      </ProLayout>
    </div>
  );
}
