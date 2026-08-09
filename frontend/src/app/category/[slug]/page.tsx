import { notFound } from "next/navigation";

import { CategoryNav } from "@/components/CategoryNav";
import { QuestionList } from "@/components/QuestionList";
import {
  getAllCategories,
  getQuestionsByCategory,
} from "@/lib/content/loadContent";
import type { QuestionListItem } from "@/types/question";

type CategoryPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }));
}

/** 分類題目列表：顯示該分類下全部題目。 */
export default function CategoryPage({ params }: CategoryPageProps) {
  const categories = getAllCategories();
  const category = categories.find((item) => item.slug === params.slug);

  if (!category) {
    notFound();
  }

  const questions: QuestionListItem[] = getQuestionsByCategory(params.slug).map(
    ({ id, slug, title, difficulty, tags, categorySlug }) => ({
      id,
      slug,
      title,
      difficulty,
      tags,
      categorySlug,
    }),
  );

  return (
    <main>
      <h1>{category.nameZh}</h1>
      <p>選擇題目開始練習。題目頁預設隱藏推薦答案。</p>
      <CategoryNav categories={categories} activeSlug={params.slug} />
      <QuestionList questions={questions} />
    </main>
  );
}
