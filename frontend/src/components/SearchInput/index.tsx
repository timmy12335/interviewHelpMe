"use client";

import { Input } from "antd";
import { useRouter } from "next/navigation";

import { useT } from "@/i18n/PreferencesProvider";

/** 頂部搜尋框；送出後導向題目大全並帶上查詢字串。 */
export function SearchInput() {
  const router = useRouter();
  const t = useT();

  return (
    <div className="search-input">
      <Input.Search
        placeholder={t("search.placeholder")}
        allowClear
        onSearch={(value) => {
          const query = value.trim();
          router.push(query ? `/questions/?q=${encodeURIComponent(query)}` : "/questions/");
        }}
      />
    </div>
  );
}
