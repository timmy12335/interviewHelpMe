import Link from "next/link";
import { notFound } from "next/navigation";

import { ModuleRoadmap } from "@/components/ModuleRoadmap";
import { QuestionList } from "@/components/QuestionList";
import {
  getAllCategories,
  getQuestionsByCategory,
} from "@/lib/content/loadContent";
import { toListItems } from "@/lib/content/toListItems";

type CategoryPageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }));
}

/** 題庫詳情頁：題庫簡報、開始練習入口與題目列表。 */
export default function CategoryPage({ params }: CategoryPageProps) {
  const categories = getAllCategories();
  const category = categories.find((item) => item.slug === params.slug);

  if (!category) {
    notFound();
  }

  const questions = toListItems(getQuestionsByCategory(params.slug));
  const firstQuestionSlug = questions[0]?.slug;
  const moduleIndex = categories.findIndex((item) => item.slug === params.slug);

  const byDifficulty = {
    easy: questions.filter((item) => item.difficulty === "easy").length,
    medium: questions.filter((item) => item.difficulty === "medium").length,
    hard: questions.filter((item) => item.difficulty === "hard").length,
  };

  return (
    <div id="bankPage" className="max-width-content bank-layout">
      <div className="bank-layout__aside">
      <section className="bank-brief hud-panel hud-brackets">
        <p className="hud-eyebrow">
          {`Module ${String(moduleIndex + 1).padStart(2, "0")} // 題庫簡報`}
        </p>
        <h1 className="bank-brief__title">{category.nameZh}</h1>
        <p className="page-lede">
          共 {questions.length} 題。答案預設封存，先自己作答再解鎖比對。
        </p>
        <dl className="bank-stats">
          <div className="bank-stat bank-stat--easy">
            <dt>簡單</dt>
            <dd>{byDifficulty.easy}</dd>
          </div>
          <div className="bank-stat bank-stat--medium">
            <dt>中等</dt>
            <dd>{byDifficulty.medium}</dd>
          </div>
          <div className="bank-stat bank-stat--hard">
            <dt>困難</dt>
            <dd>{byDifficulty.hard}</dd>
          </div>
        </dl>
        {firstQuestionSlug ? (
          <Link
            className="hud-cta"
            href={`/category/${params.slug}/question/${firstQuestionSlug}/`}
          >
            開始練習 →
          </Link>
        ) : null}
      </section>

      <ModuleRoadmap categorySlug={params.slug} questions={questions} />
      </div>

      <div className="bank-layout__main">
        <div className="section-head">
          <p className="hud-eyebrow">Units // 題目列表</p>
        </div>
        <QuestionList
          questions={questions}
          title={`題目列表（${questions.length}）`}
        />
      </div>
    </div>
  );
}
