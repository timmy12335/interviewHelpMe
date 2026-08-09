import { CategoryNav } from "@/components/CategoryNav";
import { getAllCategories } from "@/lib/content/loadContent";
import { withBasePath } from "@/lib/paths";

/** 分類首頁：列出全部題目分類與題數。 */
export default function HomePage() {
  const categories = getAllCategories();

  return (
    <main>
      <CategoryNav
        categories={categories}
        getHref={(category) => withBasePath(`/category/${category.slug}/`)}
      />
    </main>
  );
}
