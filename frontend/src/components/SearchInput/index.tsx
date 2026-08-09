"use client";

import { Input } from "antd";
import { useRouter } from "next/navigation";

/** 頂部搜尋框；送出後導向題目大全並帶上查詢字串。 */
export function SearchInput() {
  const router = useRouter();

  return (
    <div className="search-input">
      <Input.Search
        placeholder="搜尋題目"
        allowClear
        onSearch={(value) => {
          const query = value.trim();
          router.push(query ? `/questions/?q=${encodeURIComponent(query)}` : "/questions/");
        }}
      />
    </div>
  );
}
