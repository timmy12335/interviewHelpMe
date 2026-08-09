import Title from "antd/es/typography/Title";

import { CategoryBankList } from "@/components/CategoryBankList";
import { getAllCategories } from "@/lib/content/loadContent";

/** 題庫大全：列出全部分類與題數。 */
export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div id="categoriesPage" className="max-width-content">
      <Title level={3}>題庫大全</Title>
      <CategoryBankList categories={categories} />
    </div>
  );
}
