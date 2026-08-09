import type { MenuDataItem } from "@ant-design/pro-layout";

/** 頂部導覽選單；靜態站無後台，故不含權限分支。 */
export const menus: MenuDataItem[] = [
  {
    path: "/",
    name: "主頁",
  },
  {
    path: "/categories",
    name: "題庫",
  },
  {
    path: "/questions",
    name: "題目",
  },
];
