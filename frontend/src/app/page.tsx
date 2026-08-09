import { Typography } from "antd";

import { CategoryNav } from "@/components/CategoryNav";
import { getAllCategories } from "@/lib/content/loadContent";
import { withBasePath } from "@/lib/paths";

/** 分類首頁：列出全部題目分類與題數。 */
export default function HomePage() {
  const categories = getAllCategories();

  return (
    <main>
      <Typography.Title level={1}>面試題庫</Typography.Title>
      <Typography.Paragraph>
        選擇分類開始練習。題目頁預設隱藏推薦答案。
      </Typography.Paragraph>
      <CategoryNav
        categories={categories}
        getHref={(category) => withBasePath(`/category/${category.slug}/`)}
      />
    </main>
  );
}
