import type { MessageKey } from "@/i18n/messages";

/** 頂部導覽選單項目。 */
export interface MenuItem {
  /** 目標路徑，同時作為列表 key。 */
  path: string;
  /** 顯示名稱（中文，也作為測試與後備文字）。 */
  name: string;
  /** 介面字典的鍵；有的話依目前語系顯示。 */
  labelKey?: MessageKey;
  /**
   * 額外歸屬到這個項目的路徑前綴。
   *
   * 題庫與題目的詳情頁走 /category/... 這條路由，和選單上的 /categories 對不起來；
   * 列在這裡之後，瀏覽詳情頁時頂部才會正確標示目前位置。
   */
  matchPrefixes?: string[];
}

/** 頂部導覽選單；靜態站無後台，故不含權限分支。 */
export const menus: MenuItem[] = [
  {
    path: "/",
    name: "指南",
    labelKey: "nav.home",
  },
  {
    path: "/categories",
    name: "題庫",
    labelKey: "nav.categories",
    matchPrefixes: ["/category"],
  },
  {
    path: "/questions",
    name: "題目",
    labelKey: "nav.questions",
  },
  {
    path: "/cheatsheets",
    name: "速查表",
    labelKey: "nav.cheatsheets",
  },
];
