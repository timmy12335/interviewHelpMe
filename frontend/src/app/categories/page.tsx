import { CategoryBankList } from "@/components/CategoryBankList";
import { getAllCategories } from "@/lib/content/loadContent";

/** 題庫大全：列出全部分類與題數。 */
export default function CategoriesPage() {
  const categories = getAllCategories();
  const total = categories.reduce(
    (sum, category) => sum + (category.questionCount ?? 0),
    0,
  );

  return (
    <div id="categoriesPage" className="max-width-content">
      <header>
        <p className="hud-eyebrow">Modules // 題庫大全</p>
        <h1 className="page-title">
          全部題庫
          <span className="page-title__sub font-display">
            {categories.length} modules / {total} units
          </span>
        </h1>
      </header>
      <CategoryBankList categories={categories} />
    </div>
  );
}
