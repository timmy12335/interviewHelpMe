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
      <svg viewBox="0 0 32 32" width="32" height="32">
        <rect width="32" height="32" rx="8" fill="#1677ff" />
        <path
          d="M9 21.5V10.5h2.6v11zM14.4 21.5V10.5h2.5l4.2 6.6v-6.6H23v11h-2.4l-4.3-6.7v6.7z"
          fill="#fff"
        />
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
              href="https://github.com/"
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
