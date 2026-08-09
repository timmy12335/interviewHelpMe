import Link from "next/link";
import { notFound } from "next/navigation";

import { PracticeQuestion } from "@/components/PracticeQuestion";
import {
  getAllCategories,
  getAllQuestions,
  getQuestion,
} from "@/lib/content/loadContent";

type QuestionPageProps = {
  params: { slug: string; questionSlug: string };
};

export function generateStaticParams() {
  return getAllQuestions().map((question) => ({
    slug: question.categorySlug,
    questionSlug: question.slug,
  }));
}

/** 單題練習頁：預設隱藏推薦答案，可手動切換顯示。 */
export default function QuestionPage({ params }: QuestionPageProps) {
  const question = getQuestion(params.slug, params.questionSlug);

  if (!question) {
    notFound();
  }

  const category = getAllCategories().find((item) => item.slug === params.slug);

  return (
    <main>
      <p>
        <Link href={`/category/${params.slug}/`}>
          ← 返回{category ? category.nameZh : params.slug}
        </Link>
      </p>
      <h1>{question.title}</h1>
      <PracticeQuestion question={question} />
    </main>
  );
}
