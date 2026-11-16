import Link from "next/link";
import { notFound } from "next/navigation";

import { BankBoard } from "@/components/BankBoard";
import { L, T } from "@/i18n/T";
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

/** 題庫詳情頁：題庫簡報、路線圖、標籤星圖與題目列表。 */
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
    <div id="bankPage" className="max-width-content">
      <section className="bank-brief hud-panel hud-brackets">
        <p className="hud-eyebrow">
          <T
            k="bank.eyebrow"
            vars={{ index: String(moduleIndex + 1).padStart(2, "0") }}
          />
        </p>
        <h1 className="bank-brief__title">
          <L zh={category.nameZh} en={category.nameEn} />
        </h1>
        <p className="page-lede">
          <T k="bank.lede" vars={{ count: questions.length }} />
        </p>
        <dl className="bank-stats">
          <div className="bank-stat bank-stat--easy">
            <dt>
              <T k="difficulty.easy" />
            </dt>
            <dd>{byDifficulty.easy}</dd>
          </div>
          <div className="bank-stat bank-stat--medium">
            <dt>
              <T k="difficulty.medium" />
            </dt>
            <dd>{byDifficulty.medium}</dd>
          </div>
          <div className="bank-stat bank-stat--hard">
            <dt>
              <T k="difficulty.hard" />
            </dt>
            <dd>{byDifficulty.hard}</dd>
          </div>
        </dl>
        {firstQuestionSlug ? (
          <Link
            className="hud-cta"
            href={`/category/${params.slug}/question/${firstQuestionSlug}/`}
          >
            <T k="cta.start" />
          </Link>
        ) : null}
      </section>

      <BankBoard categorySlug={params.slug} questions={questions} />
    </div>
  );
}
