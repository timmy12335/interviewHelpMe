import { CategoryNav } from "@/components/CategoryNav";
import { getAllCategories } from "@/lib/content/loadContent";

/** 分類首頁：列出全部題目分類與題數。 */
export default function HomePage() {
  const categories = getAllCategories();

  return (
    <main>
      <h1>面試題庫</h1>
      <p>選擇分類開始練習。題目頁預設隱藏推薦答案。</p>
      <CategoryNav categories={categories} />
    </main>
  );
}
