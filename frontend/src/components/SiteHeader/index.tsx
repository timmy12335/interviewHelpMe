import Link from "next/link";

/** 全站頂部導覽，連回分類首頁。 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-header__brand" href="/">
        InterviewHelpMe
      </Link>
    </header>
  );
}
