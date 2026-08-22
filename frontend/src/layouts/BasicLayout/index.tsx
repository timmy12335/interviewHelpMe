"use client";

import { GithubFilled } from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { GlobalFooter } from "@/components/GlobalFooter";
import { SearchInput } from "@/components/SearchInput";
import { menus } from "@/config/menu";
import { isActiveMenuItem } from "@/lib/nav";

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

/** 全站通用版面：頂部導覽列 + 內容區 + 底部欄。 */
export function BasicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div id="basicLayout">
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="basic-layout__brand">
            <Logo />
            <span className="basic-layout__wordmark">InterviewHelpMe</span>
          </Link>

          <nav className="site-nav" aria-label="主要導覽">
            {menus.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="site-nav__link"
                aria-current={isActiveMenuItem(pathname, item) ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="site-header__actions">
            <SearchInput />
            <a
              className="basic-layout__github"
              href="https://github.com/timmy12335/interviewHelpMe"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <GithubFilled />
            </a>
          </div>
        </div>
      </header>

      <div className="site-content">{children}</div>

      <GlobalFooter />
    </div>
  );
}
