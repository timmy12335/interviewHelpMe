import Flex from "antd/es/flex";
import { Content } from "antd/es/layout/layout";
import { notFound } from "next/navigation";

import { PracticeQuestion } from "@/components/PracticeQuestion";
import { QuestionSider } from "@/components/QuestionSider";
import {
  getAllCategories,
  getAllQuestions,
  getQuestion,
  getQuestionsByCategory,
} from "@/lib/content/loadContent";
import { toListItems } from "@/lib/content/toListItems";

type QuestionPageProps = {
  params: { slug: string; questionSlug: string };
};

export function generateStaticParams() {
  return getAllQuestions().map((question) => ({
    slug: question.categorySlug,
    questionSlug: question.slug,
  }));
}

/** 題庫題目詳情頁：左側題單，右側練習卡（答案預設隱藏）。 */
export default function QuestionPage({ params }: QuestionPageProps) {
  const question = getQuestion(params.slug, params.questionSlug);

  if (!question) {
    notFound();
  }

  const category = getAllCategories().find((item) => item.slug === params.slug);
  const siblings = toListItems(getQuestionsByCategory(params.slug));

  return (
    <div id="bankQuestionPage">
      <Flex gap={24}>
        <QuestionSider
          categorySlug={params.slug}
          categoryName={category?.nameZh ?? params.slug}
          questions={siblings}
          currentSlug={params.questionSlug}
        />
        <Content>
          <PracticeQuestion question={question} />
        </Content>
      </Flex>
    </div>
  );
}
